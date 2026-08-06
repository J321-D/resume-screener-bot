"""Unit tests for internal typed data structures."""

from __future__ import annotations

import unittest

from resume_screener.models import (
    AnalysisMode,
    AnalysisResult,
    CategoryCoverage,
    ConceptCategory,
    ExtractedDocument,
    NormalizedConcept,
)


class ExtractedDocumentTests(unittest.TestCase):
    def test_preserves_text_and_optional_source_metadata(self) -> None:
        document = ExtractedDocument(
            text="Python SQL",
            source_name="resume.txt",
            media_type="text/plain",
        )

        self.assertEqual(document.text, "Python SQL")
        self.assertEqual(document.source_name, "resume.txt")
        self.assertEqual(document.media_type, "text/plain")


class AnalysisResultTests(unittest.TestCase):
    def test_preserves_existing_sets_and_score_without_transformation(self) -> None:
        resume_words = {"python", "sql"}
        job_description_words = {"python", "matlab"}
        matched = {"python"}
        missing = {"matlab"}

        result = AnalysisResult(
            resume_words=resume_words,
            job_description_words=job_description_words,
            matched=matched,
            missing=missing,
            match_score=50.0,
        )

        self.assertIs(result.resume_words, resume_words)
        self.assertIs(result.job_description_words, job_description_words)
        self.assertIs(result.matched, matched)
        self.assertIs(result.missing, missing)
        self.assertEqual(result.match_score, 50.0)


class FocusedModelTests(unittest.TestCase):
    def test_declares_stable_mode_values_and_mutable_concept_counts(self) -> None:
        concept = NormalizedConcept(
            concept="quality control",
            display_term="QC",
            category=ConceptCategory.QUALITY_REGULATORY,
            count=1,
        )
        concept.count += 1

        self.assertEqual(AnalysisMode.SKILLS_FOCUSED.value, "Skills-focused analysis")
        self.assertEqual(AnalysisMode.FULL_LEXICAL.value, "Full lexical analysis")
        self.assertEqual(concept.count, 2)

        empty_coverage = CategoryCoverage(
            ConceptCategory.EDUCATION,
            matched=0,
            total=0,
            score=0,
        )
        self.assertEqual(
            empty_coverage.display_value,
            "N/A — no applicable concepts",
        )


if __name__ == "__main__":
    unittest.main()
