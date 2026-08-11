"""Public API parity, validation, privacy, and report contract tests."""

from __future__ import annotations

import asyncio
import unittest
from io import BytesIO
from os import environ
from unittest.mock import patch
from zipfile import ZIP_DEFLATED, ZipFile

import fitz
from fastapi import UploadFile
from fastapi.testclient import TestClient

from api.config import allowed_origins
from api.errors import PublicApiError
from api.main import app
from api.middleware import MAX_REQUEST_BODY_BYTES, RequestBodyLimitMiddleware
from api.services.document_service import (
    MAX_EXTRACTED_TEXT_CHARACTERS,
    MAX_RESUME_UPLOADS,
    MAX_TEXT_CHARACTERS,
    prepare_documents,
    safe_filename,
    unique_labels,
)
from resume_screener.models import AnalysisMode, ExtractedDocument


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

    def test_openapi_documents_the_stable_v1_routes_and_response_shape(self) -> None:
        response = self.client.get("/openapi.json")

        self.assertEqual(response.status_code, 200)
        schema = response.json()
        self.assertEqual(set(schema["paths"]["/api/v1/analyze"]), {"post"})
        self.assertEqual(set(schema["paths"]["/api/v1/report"]), {"post"})
        properties = schema["components"]["schemas"]["AnalysisResponse"]["properties"]
        self.assertEqual(
            set(properties),
            {
                "analysis_mode",
                "coverage",
                "matched_terms",
                "missing_terms",
                "categories",
                "normalized_matches",
                "metadata",
                "warnings",
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
        self.assertEqual(response.headers["cache-control"], "no-store")

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

    def test_text_limit_and_error_response_cache_policy_are_enforced(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            data={
                "resume_text": "x" * (MAX_TEXT_CHARACTERS + 1),
                "job_description_text": "Python",
            },
        )

        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.json()["error"]["code"], "text_too_large")
        self.assertEqual(response.headers["cache-control"], "no-store")

    def test_post_extraction_limit_and_binary_text_are_rejected(self) -> None:
        oversized_text = self.client.post(
            "/api/v1/analyze",
            data={"job_description_text": "Python"},
            files={
                "resumes": (
                    "resume.txt",
                    b"x" * (MAX_EXTRACTED_TEXT_CHARACTERS + 1),
                    "text/plain",
                )
            },
        )
        binary_text = self.client.post(
            "/api/v1/analyze",
            data={"job_description_text": "Python"},
            files={"resumes": ("resume.txt", b"Python\x00binary", "text/plain")},
        )

        self.assertEqual(oversized_text.status_code, 413)
        self.assertEqual(
            oversized_text.json()["error"]["code"], "extracted_text_too_large"
        )
        self.assertEqual(binary_text.status_code, 415)
        self.assertEqual(
            binary_text.json()["error"]["code"], "unsupported_file_type"
        )

    def test_post_extraction_limit_is_shared_by_every_supported_media_type(self) -> None:
        oversized = ExtractedDocument(
            text="x" * (MAX_EXTRACTED_TEXT_CHARACTERS + 1),
            source_name="synthetic",
        )
        with patch(
            "api.services.document_service.parse_uploaded_document",
            return_value=oversized,
        ):
            for suffix, media_type, content in (
                ("pdf", "application/pdf", b"%PDF-synthetic"),
                (
                    "docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    b"PK-synthetic",
                ),
                ("txt", "text/plain", b"synthetic"),
            ):
                with self.subTest(suffix=suffix):
                    from api.services.document_service import _parse_buffered

                    with self.assertRaises(PublicApiError) as caught:
                        _parse_buffered(
                            content,
                            f"resume.{suffix}",
                            media_type,
                            "resumes",
                        )
                    self.assertEqual(caught.exception.code, "extracted_text_too_large")

    def test_early_text_rejection_closes_all_framework_upload_handles(self) -> None:
        resume = UploadFile(filename="resume.txt", file=BytesIO(b"Python"))
        job = UploadFile(filename="job.txt", file=BytesIO(b"Python"))

        with self.assertRaises(PublicApiError):
            asyncio.run(prepare_documents(
                [resume],
                job,
                "x" * (MAX_TEXT_CHARACTERS + 1),
                "Python",
            ))

        self.assertTrue(resume.file.closed)
        self.assertTrue(job.file.closed)

    def test_docx_archive_with_suspicious_compression_is_rejected(self) -> None:
        buffer = BytesIO()
        with ZipFile(buffer, "w", compression=ZIP_DEFLATED) as archive:
            archive.writestr("[Content_Types].xml", "types")
            archive.writestr("word/document.xml", "A" * (2 * 1024 * 1024))
        response = self.client.post(
            "/api/v1/analyze",
            data={"job_description_text": "Python"},
            files={
                "resumes": (
                    "compressed.docx",
                    buffer.getvalue(),
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                )
            },
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.json()["error"]["code"], "unsafe_docx")

    def test_method_content_type_and_negative_cors_contracts(self) -> None:
        method = self.client.get("/api/v1/analyze")
        allowed = self.client.options(
            "/api/v1/analyze",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        denied = self.client.options(
            "/api/v1/analyze",
            headers={
                "Origin": "https://unrelated.example",
                "Access-Control-Request-Method": "POST",
            },
        )

        self.assertEqual(method.status_code, 405)
        self.assertTrue(method.headers["content-type"].startswith("application/json"))
        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(
            allowed.headers.get("access-control-allow-origin"),
            "http://localhost:3000",
        )
        self.assertNotEqual(allowed.headers.get("access-control-allow-origin"), "*")
        self.assertNotEqual(allowed.headers.get("access-control-allow-credentials"), "true")
        self.assertNotEqual(denied.headers.get("access-control-allow-origin"), "*")
        self.assertIsNone(denied.headers.get("access-control-allow-origin"))

    def test_declared_request_body_limit_runs_before_multipart_parsing(self) -> None:
        response = self.client.post(
            "/api/v1/analyze",
            content=b"not-a-multipart-body",
            headers={
                "content-type": "multipart/form-data; boundary=fixture",
                "content-length": str(MAX_REQUEST_BODY_BYTES + 1),
                "origin": "http://localhost:3000",
            },
        )

        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.json()["error"]["code"], "request_body_too_large")
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertEqual(
            response.headers["access-control-allow-origin"], "http://localhost:3000"
        )

    def test_streamed_request_body_limit_stops_before_downstream_parsing(self) -> None:
        sent: list[dict[str, object]] = []
        downstream_called = False
        incoming = iter(
            [
                {"type": "http.request", "body": b"123", "more_body": True},
                {"type": "http.request", "body": b"456", "more_body": False},
            ]
        )

        async def downstream(scope, receive, send) -> None:  # type: ignore[no-untyped-def]
            del scope, receive, send
            nonlocal downstream_called
            downstream_called = True

        async def receive() -> dict[str, object]:
            return next(incoming)

        async def send(message: dict[str, object]) -> None:
            sent.append(message)

        middleware = RequestBodyLimitMiddleware(downstream, max_body_bytes=5)
        asyncio.run(
            middleware(
                {
                    "type": "http",
                    "path": "/api/v1/analyze",
                    "headers": [],
                },
                receive,  # type: ignore[arg-type]
                send,  # type: ignore[arg-type]
            )
        )

        self.assertFalse(downstream_called)
        self.assertEqual(sent[0]["status"], 413)
        body = sent[1]["body"]
        self.assertIn(b"request_body_too_large", body)

    def test_configured_cors_origins_fail_closed_and_deduplicate(self) -> None:
        with patch.dict(
            environ,
            {
                "RESUME_SCREENER_ALLOWED_ORIGINS": (
                    "https://resume-keyword-screener.vercel.app,"
                    "https://resume-keyword-screener.vercel.app"
                )
            },
            clear=False,
        ):
            self.assertEqual(
                allowed_origins(),
                ["https://resume-keyword-screener.vercel.app"],
            )

        for invalid in ("*", "https://example.com/path", "javascript:alert(1)"):
            with self.subTest(invalid=invalid), patch.dict(
                environ,
                {"RESUME_SCREENER_ALLOWED_ORIGINS": invalid},
                clear=False,
            ):
                with self.assertRaises(RuntimeError):
                    allowed_origins()

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
        self.assertEqual(safe_filename("../../résumé\x00\u202e.txt"), "résumé.txt")

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
