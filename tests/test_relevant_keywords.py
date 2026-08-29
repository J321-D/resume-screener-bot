"""Tests for the additive deterministic Relevant Keyword Review layer."""

from __future__ import annotations

import unittest

from api.services.document_service import PreparedDocuments
from api.services.relevant_keyword_service import build_relevant_keywords
from resume_screener.models import ExtractedDocument


class RelevantKeywordTests(unittest.TestCase):
    def _documents(self, resume: str, job: str) -> PreparedDocuments:
        return PreparedDocuments(
            resumes=[ExtractedDocument(text=resume, source_name="resume.txt", media_type="text/plain")],
            job_description=ExtractedDocument(text=job, source_name="job.txt", media_type="text/plain"),
            resume_label="resume.txt",
            input_mode="files",
            warnings=[],
        )

    def test_filters_generic_raw_tokens_and_preserves_curated_phrases(self) -> None:
        documents = self._documents(
            "Mammalian cell culture and scale-up validation.",
            "Protein purification or tech transfer; mammalian cell culture. Contribute to the team.",
        )

        results = build_relevant_keywords(documents)
        by_term = {item.normalized_term: item for item in results}

        self.assertEqual(
            set(by_term),
            {"protein purification", "technology transfer", "mammalian cell culture"},
        )
        self.assertEqual(by_term["mammalian cell culture"].status, "matched")
        self.assertEqual(by_term["protein purification"].status, "missing")
        self.assertEqual(by_term["technology transfer"].status, "missing")
        self.assertNotIn("or", by_term)
        self.assertNotIn("contribute", by_term)

    def test_missing_keyword_evidence_points_only_to_job_description(self) -> None:
        documents = self._documents(
            "Used Bradford assays for chemical analysis.",
            "Experience with protein purification is preferred.",
        )

        result = build_relevant_keywords(documents)[0]

        self.assertEqual(result.normalized_term, "protein purification")
        self.assertEqual(result.status, "missing")
        self.assertTrue(result.evidence)
        self.assertTrue(
            all(item.source_document == "job_description" for item in result.evidence)
        )
        evidence = result.evidence[0]
        source = documents.job_description.text
        self.assertEqual(
            source[evidence.source_span.start : evidence.source_span.end],
            evidence.matched_surface,
        )
        self.assertEqual(evidence.matched_surface, "protein purification")

    def test_matched_keyword_includes_exact_resume_and_job_evidence(self) -> None:
        documents = self._documents(
            "Supported mammalian cell culture development.",
            "Mammalian cell culture experience preferred.",
        )

        result = build_relevant_keywords(documents)[0]

        self.assertEqual(result.status, "matched")
        self.assertEqual(
            {item.source_document for item in result.evidence},
            {"resume", "job_description"},
        )
        for evidence in result.evidence:
            source = (
                documents.resumes[0].text
                if evidence.source_document == "resume"
                else documents.job_description.text
            )
            self.assertEqual(
                source[evidence.source_span.start : evidence.source_span.end],
                evidence.matched_surface,
            )

    def test_bradford_does_not_infer_protein_purification(self) -> None:
        documents = self._documents(
            "Bradford assay downstream validation.",
            "Protein purification and technology transfer.",
        )

        by_term = {item.normalized_term: item for item in build_relevant_keywords(documents)}

        self.assertEqual(by_term["protein purification"].status, "missing")
        self.assertEqual(by_term["technology transfer"].status, "missing")


if __name__ == "__main__":
    unittest.main()
