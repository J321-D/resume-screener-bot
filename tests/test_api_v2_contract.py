"""Contract v2 provenance, privacy, determinism, and v1 parity tests."""

from __future__ import annotations

import unittest
from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

import fitz
from fastapi.testclient import TestClient

from api.main import app
from resume_screener.models import AnalysisMode


def _pdf_bytes(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    content = document.tobytes()
    document.close()
    return content


def _docx_bytes(text: str) -> bytes:
    content = BytesIO()
    document_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/'
        'wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>'
        f"{text}"
        "</w:t></w:r></w:p></w:body></w:document>"
    )
    with ZipFile(content, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", "<Types />")
        archive.writestr("word/document.xml", document_xml)
    return content.getvalue()


class ApiV2ContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app, raise_server_exceptions=False)

    def _post(
        self,
        resume: str,
        job: str,
        mode: AnalysisMode = AnalysisMode.SKILLS_FOCUSED,
    ):
        return self.client.post(
            "/api/v2/analyze",
            data={
                "analysis_mode": mode.value,
                "resume_text": resume,
                "job_description_text": job,
            },
        )

    def test_v2_carries_the_unchanged_v1_analysis_result(self) -> None:
        data = {
            "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
            "resume_text": "Python SQL",
            "job_description_text": "Python SQL MATLAB",
        }
        v1 = self.client.post("/api/v1/analyze", data=data)
        v2 = self.client.post("/api/v2/analyze", data=data)

        self.assertEqual(v1.status_code, 200)
        self.assertEqual(v2.status_code, 200)
        v1_analysis = v1.json()
        v2_analysis = v2.json()["analysis"]
        v1_analysis["metadata"].pop("analyzed_at")
        v2_analysis["metadata"].pop("analyzed_at")
        self.assertEqual(v2_analysis, v1_analysis)
        self.assertEqual(v2.json()["analysis"]["coverage"]["score"], 66.7)
        self.assertEqual(v2.headers["cache-control"], "no-store")

    def test_openapi_exposes_v2_without_changing_v1_schema(self) -> None:
        schema = self.client.get("/openapi.json").json()

        self.assertEqual(set(schema["paths"]["/api/v2/analyze"]), {"post"})
        v1_properties = schema["components"]["schemas"]["AnalysisResponse"][
            "properties"
        ]
        self.assertEqual(
            set(v1_properties),
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

    def test_ids_and_order_are_deterministic_across_identical_requests(self) -> None:
        first = self._post("QC and C++", "quality control C++ Node.js").json()
        second = self._post("QC and C++", "quality control C++ Node.js").json()

        self.assertEqual(first["source_documents"], second["source_documents"])
        self.assertEqual(first["findings"], second["findings"])
        self.assertTrue(
            all(item["finding_id"].startswith("finding_") for item in first["findings"])
        )
        self.assertTrue(
            all(
                evidence["evidence_id"].startswith("evidence_")
                for finding in first["findings"]
                for evidence in finding["evidence"]
            )
        )

    def test_every_span_reconstructs_repeated_case_punctuation_and_unicode(self) -> None:
        resume = "Python PYTHON C++ C# .NET Node.js café 品質"
        job = "python Python C++ C# .NET Node.js café 品質 python"
        payload = self._post(resume, job, AnalysisMode.FULL_LEXICAL).json()
        texts = {
            payload["source_documents"][0]["document_id"]: resume,
            payload["source_documents"][1]["document_id"]: job,
        }

        for finding in payload["findings"]:
            for evidence in finding["evidence"]:
                span = evidence["source_span"]
                self.assertEqual(span["unit"], "unicode_code_point")
                self.assertEqual(
                    texts[evidence["document_id"]][span["start"] : span["end"]],
                    evidence["matched_surface"],
                )
        python = next(
            item for item in payload["findings"] if item["normalized_term"] == "python"
        )
        self.assertEqual(
            [item["matched_surface"] for item in python["evidence"]],
            ["Python", "PYTHON", "python", "Python", "python"],
        )
        for term in ("c++", "c#", ".net", "node.js", "café", "品質"):
            finding = next(
                item for item in payload["findings"] if item["normalized_term"] == term
            )
            self.assertTrue(finding["evidence"])

    def test_unicode_lowercase_expansion_keeps_authoritative_source_offsets(self) -> None:
        resume = "İstanbul Python"
        job = "İstanbul Python SQL"
        payload = self._post(resume, job).json()
        texts = {"resume_1": resume, "job_description_1": job}

        for finding in payload["findings"]:
            for evidence in finding["evidence"]:
                span = evidence["source_span"]
                self.assertEqual(
                    texts[evidence["document_id"]][span["start"] : span["end"]],
                    evidence["matched_surface"],
                )

    def test_focused_phrase_and_synonym_provenance_are_authoritative(self) -> None:
        resume = "QC and cell-culture"
        job = "Quality Control and cell culture"
        payload = self._post(resume, job).json()
        by_term = {item["normalized_term"]: item for item in payload["findings"]}

        quality = by_term["quality control"]
        self.assertEqual(quality["match_method"], "curated_synonym")
        self.assertEqual(quality["reason"], "curated_normalization")
        self.assertEqual(
            [item["matched_surface"] for item in quality["evidence"]],
            ["QC", "Quality Control"],
        )
        culture = by_term["cell culture"]
        self.assertEqual(culture["match_method"], "curated_synonym")
        self.assertEqual(
            [item["matched_surface"] for item in culture["evidence"]],
            ["cell-culture", "cell culture"],
        )

    def test_missing_findings_return_only_job_evidence(self) -> None:
        payload = self._post("Python", "Python SQL").json()
        missing = next(
            item for item in payload["findings"] if item["status"] == "missing"
        )

        self.assertEqual(missing["normalized_term"], "sql")
        self.assertEqual(missing["match_method"], "not_detected")
        self.assertEqual(missing["reason"], "not_detected")
        self.assertTrue(missing["evidence"])
        self.assertTrue(
            all(
                item["source_document"] == "job_description"
                for item in missing["evidence"]
            )
        )

    def test_multiple_resumes_remain_distinct_while_analysis_keeps_union(self) -> None:
        response = self.client.post(
            "/api/v2/analyze",
            data={
                "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
                "job_description_text": "Python SQL MATLAB",
            },
            files=[
                ("resumes", ("one.txt", b"Python", "text/plain")),
                ("resumes", ("two.txt", b"SQL", "text/plain")),
            ],
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["analysis"]["coverage"]["score"], 66.7)
        resumes = [
            item
            for item in payload["source_documents"]
            if item["source_document"] == "resume"
        ]
        self.assertEqual(len(resumes), 2)
        self.assertEqual(len({item["document_id"] for item in resumes}), 2)

    def test_document_view_reconstructs_exact_canonical_text_and_maps_evidence(self) -> None:
        resume = "private résumé phrase Python"
        job = "private job phrase Python SQL"
        response = self._post(resume, job)
        payload = response.json()
        expected = {"resume_1": resume, "job_description_1": job}

        for document in payload["source_documents"]:
            blocks = document["blocks"]
            reconstructed = "".join(block["text"] for block in blocks)
            self.assertEqual(reconstructed, expected[document["document_id"]])
            self.assertEqual(document["canonical_text_characters"], len(reconstructed))
            self.assertEqual(blocks[0]["start"], 0)
            self.assertEqual(blocks[-1]["end"], len(reconstructed))
            for previous, current in zip(blocks, blocks[1:]):
                self.assertEqual(previous["end"], current["start"])
            for block in blocks:
                self.assertEqual(
                    reconstructed[block["start"] : block["end"]], block["text"]
                )
                self.assertEqual(
                    block["block_type"],
                    {"value": None, "unknown_reason": "parser_limitation"},
                )
            self.assertEqual(
                document["document_structure_metadata"],
                {"value": None, "unknown_reason": "not_detected"},
            )
            self.assertEqual(
                document["formatting_metadata"],
                {"value": None, "unknown_reason": "parser_limitation"},
            )

        blocks_by_document = {
            document["document_id"]: document["blocks"]
            for document in payload["source_documents"]
        }
        for finding in payload["findings"]:
            for evidence in finding["evidence"]:
                span = evidence["source_span"]
                overlaps = [
                    block
                    for block in blocks_by_document[evidence["document_id"]]
                    if block["start"] < span["end"] and span["start"] < block["end"]
                ]
                self.assertTrue(overlaps)
                self.assertTrue(
                    all(evidence["evidence_id"] in block["evidence_refs"] for block in overlaps)
                )
        self.assertTrue(
            all(
                evidence["source_section"]["unknown_reason"] == "not_detected"
                for finding in payload["findings"]
                for evidence in finding["evidence"]
            )
        )

    def test_v2_returns_exact_sections_and_maps_evidence_without_changing_analysis(self) -> None:
        resume = "SKILLS\nPython SQL\n\nEXPERIENCE\nBuilt systems"
        job = "SKILLS\nPython SQL MATLAB\n\nEDUCATION\nDegree"
        payload = self._post(resume, job, AnalysisMode.FULL_LEXICAL).json()

        for document in payload["source_documents"]:
            sections = document["sections"]
            self.assertGreaterEqual(len(sections), 2)
            self.assertEqual(document["document_structure_metadata"]["availability"], "detected")
            canonical = "".join(block["text"] for block in document["blocks"])
            for section in sections:
                self.assertEqual(
                    canonical[section["heading_span"]["start"] : section["heading_span"]["end"]],
                    section["raw_heading"],
                )
                self.assertEqual(canonical[section["start"] : section["end"]][0 : len(section["raw_heading"])], section["raw_heading"])

        python = next(item for item in payload["findings"] if item["normalized_term"] == "python")
        self.assertTrue(all("section_id" in item["source_section"] for item in python["evidence"]))
        v1 = self.client.post(
            "/api/v1/analyze",
            data={
                "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
                "resume_text": resume,
                "job_description_text": job,
            },
        ).json()
        payload["analysis"]["metadata"].pop("analyzed_at")
        v1["metadata"].pop("analyzed_at")
        self.assertEqual(payload["analysis"], v1)

    def test_v2_keeps_semantic_sections_unavailable_for_ambiguous_prose(self) -> None:
        payload = self._post(
            "Experience with Python and skills in SQL",
            "We value experience with Python SQL MATLAB",
            AnalysisMode.FULL_LEXICAL,
        ).json()

        self.assertTrue(all(not item["sections"] for item in payload["source_documents"]))
        self.assertTrue(
            all(
                item["document_structure_metadata"]["unknown_reason"] == "not_detected"
                for item in payload["source_documents"]
            )
        )

    def test_diagnostics_are_real_deterministic_rules_not_test_inventory(self) -> None:
        payload = self._post(
            "SKILLS\nPython",
            "SKILLS\nPython SQL",
            AnalysisMode.FULL_LEXICAL,
        ).json()
        diagnostics = payload["diagnostics"]

        self.assertEqual(len(diagnostics), 8)
        self.assertEqual(
            {item["rule_id"] for item in diagnostics},
            {
                "document.text_extracted",
                "document.semantic_sections",
                "document.repeated_section_type",
                "coverage.threshold_30_percent",
                "coverage.opportunities_present",
            },
        )
        self.assertFalse(any("267" in item["message"] for item in diagnostics))
        opportunities = next(
            item
            for item in diagnostics
            if item["rule_id"] == "coverage.opportunities_present"
        )
        self.assertEqual(opportunities["status"], "review")
        self.assertTrue(opportunities["evidence_refs"])

    def test_diagnostic_threshold_preserves_strict_below_30_boundary(self) -> None:
        at_boundary = self._post(
            "one two three",
            "one two three four five six seven eight nine ten",
            AnalysisMode.FULL_LEXICAL,
        ).json()
        below = self._post(
            "one two",
            "one two three four five six seven eight nine ten",
            AnalysisMode.FULL_LEXICAL,
        ).json()

        def threshold(payload):
            return next(
                item
                for item in payload["diagnostics"]
                if item["rule_id"] == "coverage.threshold_30_percent"
            )

        self.assertEqual(at_boundary["analysis"]["coverage"]["score"], 30.0)
        self.assertEqual(threshold(at_boundary)["status"], "pass")
        self.assertEqual(threshold(below)["status"], "review")

    def test_document_blocks_preserve_unicode_empty_lines_and_cross_block_evidence(self) -> None:
        prefix = "α" * 1192
        resume = f"{prefix} quality control\n\nrésumé 品質"
        job = "quality control résumé 品質"
        payload = self._post(resume, job).json()
        document = payload["source_documents"][0]

        self.assertEqual("".join(block["text"] for block in document["blocks"]), resume)
        self.assertGreater(len(document["blocks"]), 1)
        quality = next(
            finding
            for finding in payload["findings"]
            if finding["normalized_term"] == "quality control"
        )
        resume_evidence = next(
            evidence
            for evidence in quality["evidence"]
            if evidence["source_document"] == "resume"
        )
        overlapping = [
            block
            for block in document["blocks"]
            if block["start"] < resume_evidence["source_span"]["end"]
            and resume_evidence["source_span"]["start"] < block["end"]
        ]
        self.assertEqual(len(overlapping), 2)
        self.assertTrue(
            all(resume_evidence["evidence_id"] in block["evidence_refs"] for block in overlapping)
        )

    def test_document_view_uses_exact_successful_pdf_docx_and_txt_parser_outputs(self) -> None:
        response = self.client.post(
            "/api/v2/analyze",
            data={
                "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
                "job_description_text": "PDF DOCX TXT",
            },
            files=[
                ("resumes", ("resume.pdf", _pdf_bytes("PDF"), "application/pdf")),
                (
                    "resumes",
                    (
                        "resume.docx",
                        _docx_bytes("DOCX"),
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ),
                ),
                ("resumes", ("resume.txt", b"TXT", "text/plain")),
            ],
        )

        self.assertEqual(response.status_code, 200)
        documents = response.json()["source_documents"]
        reconstructed = {
            document["media_type"]: "".join(
                block["text"] for block in document["blocks"]
            )
            for document in documents
            if document["source_document"] == "resume"
        }
        self.assertEqual(reconstructed["application/pdf"], "PDF\n")
        self.assertEqual(
            reconstructed[
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ],
            "DOCX",
        )
        self.assertEqual(reconstructed["text/plain"], "TXT")

    def test_v2_reuses_v1_error_contract_and_input_precedence(self) -> None:
        empty = self.client.post("/api/v2/analyze")
        precedence = self.client.post(
            "/api/v2/analyze",
            data={
                "analysis_mode": AnalysisMode.FULL_LEXICAL.value,
                "resume_text": "Python SQL",
                "job_description_text": "Python SQL MATLAB",
            },
            files={
                "job_description_file": ("role.txt", b"Python SQL", "text/plain")
            },
        )

        self.assertEqual(empty.status_code, 422)
        self.assertEqual(empty.json()["error"]["code"], "missing_resume")
        self.assertEqual(precedence.status_code, 200)
        self.assertEqual(precedence.json()["analysis"]["coverage"]["score"], 66.7)


if __name__ == "__main__":
    unittest.main()
