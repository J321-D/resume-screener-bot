"""Public API parity, validation, privacy, and report contract tests."""

from __future__ import annotations

import unittest
from unittest.mock import patch

import fitz
from fastapi.testclient import TestClient

from api.main import app
from api.services.document_service import MAX_RESUME_UPLOADS, safe_filename, unique_labels
from resume_screener.models import AnalysisMode


class ApiContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app, raise_server_exceptions=False)

    def test_health_uses_versioned_route(self) -> None:
        response = self.client.get("/api/v1/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "status": "ok",
                "service": "resume-keyword-screener",
                "api_version": "v1",
            },
        )

    def test_full_lexical_mode_preserves_documented_score_and_order(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            data={
                "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
                "resume_text": "Python SQL",
                "job_description_text": "Python SQL MATLAB",
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["coverage"]["score"], 66.7)
        self.assertEqual(payload["coverage"]["matched"], 2)
        self.assertEqual(
            [item["term"] for item in payload["matched_terms"]],
            ["python", "sql"],
        )
        self.assertEqual(
            [item["term"] for item in payload["missing_terms"]],
            ["matlab"],
        )

    def test_focused_mode_reuses_categories_and_normalized_explanations(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            data={
                "resume_text": "QC Python",
                "job_description_text": "quality control Python SQL",
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["coverage"]["score"], 66.7)
        self.assertEqual(payload["coverage"]["label"], "Categorized Keyword Coverage")
        self.assertEqual(
            payload["normalized_matches"][0],
            {
                "concept": "quality control",
                "resume_term": "QC",
                "job_term": "quality control",
            },
        )
        uncategorized = next(
            item for item in payload["categories"] if item["category"] == "Uncategorized"
        )
        self.assertFalse(uncategorized["included_in_primary"])

    def test_multiple_resume_files_preserve_union_behavior_and_duplicate_labels(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            data={
                "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
                "job_description_text": "Python SQL MATLAB",
            },
            files=[
                ("resumes", ("resume.txt", b"Python", "text/plain")),
                ("resumes", ("resume.txt", b"SQL", "text/plain")),
            ],
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["coverage"]["score"], 66.7)
        self.assertEqual(payload["metadata"]["resume_label"], "Combined résumés (2)")
        self.assertEqual(payload["metadata"]["resume_count"], 2)
        self.assertEqual(
            unique_labels(["resume.txt", "resume.txt"]),
            ["resume.txt", "resume (2).txt"],
        )

    def test_manual_job_description_preserves_upload_override_precedence(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            data={
                "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
                "resume_text": "Python SQL",
                "job_description_text": "Python SQL MATLAB",
            },
            files={
                "job_description_file": (
                    "role.txt",
                    b"Python SQL",
                    "text/plain",
                )
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["coverage"]["score"], 66.7)

    def test_invalid_upload_is_nonfatal_when_another_resume_is_valid(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            data={
                "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
                "job_description_text": "Python SQL",
            },
            files=[
                ("resumes", ("broken.pdf", b"not a pdf", "application/pdf")),
                ("resumes", ("resume.txt", b"Python", "text/plain")),
            ],
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["coverage"]["score"], 50.0)
        self.assertEqual(
            response.json()["warnings"][0]["code"], "unsupported_file_type"
        )

    def test_empty_inputs_return_structured_field_error(self) -> None:
        response = self.client.post("/api/v1/analyze")

        self.assertEqual(response.status_code, 422)
        self.assertEqual(
            response.json(),
            {
                "error": {
                    "code": "missing_resume",
                    "message": (
                        "Add at least one readable résumé file or paste résumé text."
                    ),
                    "field": "resumes",
                    "request_id": None,
                }
            },
        )

    def test_framework_validation_errors_use_the_public_error_contract(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            data={
                "analysis_mode": "unknown mode",
                "resume_text": "Python",
                "job_description_text": "Python",
            },
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(
            response.json(),
            {
                "error": {
                    "code": "invalid_request",
                    "message": "Check the submitted fields and try again.",
                    "field": "analysis_mode",
                    "request_id": None,
                }
            },
        )

    def test_zero_byte_and_unsupported_uploads_are_rejected(self) -> None:
        zero = self.client.post(
            "/api/v1/analyze",
            data={"job_description_text": "Python"},
            files={"resumes": ("resume.txt", b"", "text/plain")},
        )
        unsupported = self.client.post(
            "/api/v1/analyze",
            data={"job_description_text": "Python"},
            files={"resumes": ("resume.exe", b"MZ executable", "application/octet-stream")},
        )

        self.assertEqual(zero.status_code, 422)
        self.assertEqual(zero.json()["error"]["code"], "empty_file")
        self.assertEqual(unsupported.status_code, 415)
        self.assertEqual(
            unsupported.json()["error"]["code"], "unsupported_file_type"
        )

    def test_malformed_and_empty_pdfs_map_existing_parser_errors(self) -> None:
        malformed = self.client.post(
            "/api/v1/analyze",
            data={"job_description_text": "Python"},
            files={"resumes": ("broken.pdf", b"%PDF-not-valid", "application/pdf")},
        )
        with fitz.open() as document:
            document.new_page()
            empty_pdf = document.tobytes()
        empty = self.client.post(
            "/api/v1/analyze",
            data={"job_description_text": "Python"},
            files={"resumes": ("empty.pdf", empty_pdf, "application/pdf")},
        )

        self.assertEqual(malformed.status_code, 422)
        self.assertEqual(malformed.json()["error"]["code"], "malformed_pdf")
        self.assertEqual(empty.status_code, 422)
        self.assertEqual(empty.json()["error"]["code"], "no_extractable_text")

    def test_resume_count_and_filename_sanitization_are_enforced(self) -> None:
        files = [
            ("resumes", (f"resume-{index}.txt", b"Python", "text/plain"))
            for index in range(MAX_RESUME_UPLOADS + 1)
        ]
        response = self.client.post(
            "/api/v1/analyze",
            data={"job_description_text": "Python"},
            files=files,
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["error"]["code"], "too_many_resumes")
        self.assertEqual(safe_filename("../../résumé\x00.txt"), "résumé.txt")

    def test_report_recomputes_inputs_and_returns_valid_pdf(self) -> None:
        response = self.client.post(
            "/api/v1/report",
            data={
                "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
                "resume_text": "Python SQL",
                "job_description_text": "Python SQL MATLAB",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["content-type"], "application/pdf")
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertTrue(response.content.startswith(b"%PDF-"))
        self.assertGreater(len(response.content), 500)

    def test_unexpected_report_failure_is_private_and_trace_free(self) -> None:
        with patch(
            "api.services.report_service.generate_pdf_report",
            side_effect=RuntimeError("secret résumé text"),
        ):
            response = self.client.post(
                "/api/v1/report",
                data={
                    "resume_text": "Python",
                    "job_description_text": "Python",
                },
            )

        self.assertEqual(response.status_code, 500)
        payload = response.json()["error"]
        self.assertEqual(payload["code"], "internal_error")
        self.assertTrue(payload["request_id"])
        self.assertNotIn("secret", response.text)


if __name__ == "__main__":
    unittest.main()
