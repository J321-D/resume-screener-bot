"""Tests for Unicode-safe PDF report generation."""

from __future__ import annotations

import unittest
import warnings

import fitz

from resume_screener.reporting import generate_pdf_report
from resume_screener.models import (
    CategoryCoverage,
    ConceptCategory,
    NormalizedMatchExplanation,
    PrimaryCoverage,
)


def extract_pdf_text(pdf_bytes: bytes) -> str:
    """Extract report text with the same declared PDF dependency."""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
        return "".join(page.get_text() for page in document)


class GeneratePdfReportTests(unittest.TestCase):
    def assert_valid_pdf(self, pdf_bytes: bytes) -> None:
        self.assertIs(type(pdf_bytes), bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertIn(b"%%EOF", pdf_bytes[-16:])
        self.assertGreater(len(pdf_bytes), 100)

    def test_generates_ascii_report(self) -> None:
        pdf_bytes = generate_pdf_report({"sql", "python"}, ["matlab"])

        self.assert_valid_pdf(pdf_bytes)
        report_text = extract_pdf_text(pdf_bytes)
        self.assertIn("Keyword Matching Report", report_text)
        self.assertIn("Matched Keywords: ['python', 'sql']", report_text)
        self.assertIn("Missing Keywords: ['matlab']", report_text)

    def test_preserves_accented_latin_text(self) -> None:
        report_text = extract_pdf_text(
            generate_pdf_report({"résumé", "café"}, ["naïve"])
        )

        self.assertIn("café", report_text)
        self.assertIn("résumé", report_text)
        self.assertIn("naïve", report_text)

    def test_preserves_chinese_text(self) -> None:
        report_text = extract_pdf_text(generate_pdf_report({"数据"}, ["分析"]))

        self.assertIn("数据", report_text)
        self.assertIn("分析", report_text)

    def test_preserves_japanese_text(self) -> None:
        report_text = extract_pdf_text(
            generate_pdf_report({"日本語"}, ["機械学習"])
        )

        self.assertIn("日本語", report_text)
        self.assertIn("機械学習", report_text)

    def test_preserves_korean_text(self) -> None:
        report_text = extract_pdf_text(
            generate_pdf_report({"한국어"}, ["데이터"])
        )

        self.assertIn("한국어", report_text)
        self.assertIn("데이터", report_text)

    def test_preserves_mixed_unicode_technical_terms(self) -> None:
        report_text = extract_pdf_text(
            generate_pdf_report(
                {"C++", "Node.js", "机器学习"},
                ["品質管理", "실시간"],
            )
        )

        for term in ("C++", "Node.js", "机器学习", "品質管理", "실시간"):
            self.assertIn(term, report_text)

    def test_replaces_unsupported_glyphs_without_failing(self) -> None:
        pdf_bytes = generate_pdf_report({"python🙂"}, [])

        self.assert_valid_pdf(pdf_bytes)
        self.assertIn("python?", extract_pdf_text(pdf_bytes))

    def test_emits_no_deprecated_fpdf_warnings(self) -> None:
        with warnings.catch_warnings(record=True) as caught:
            warnings.simplefilter("always")
            generate_pdf_report({"python"}, ["sql"])

        deprecated = [
            warning
            for warning in caught
            if issubclass(warning.category, DeprecationWarning)
            or "deprecated" in str(warning.message).lower()
        ]
        self.assertEqual(deprecated, [])

    def test_preserves_section_order_keyword_order_and_truncation(self) -> None:
        missing_keywords = [f"missing{index}" for index in range(51)]
        report_text = extract_pdf_text(
            generate_pdf_report({"sql", "python"}, missing_keywords)
        )
        normalized = " ".join(report_text.split())

        title_position = normalized.index("Keyword Matching Report")
        matched_position = normalized.index("Matched Keywords:")
        missing_position = normalized.index("Missing Keywords:")
        self.assertLess(title_position, matched_position)
        self.assertLess(matched_position, missing_position)
        self.assertIn("Matched Keywords: ['python', 'sql']", normalized)
        self.assertLess(normalized.index("missing0"), normalized.index("missing49"))
        self.assertNotIn("missing50", normalized)

    def test_adds_mode_categories_and_normalized_matches_after_existing_sections(self) -> None:
        categories = {
            category: CategoryCoverage(category, 0, 0, 0)
            for category in ConceptCategory
        }
        categories[ConceptCategory.QUALITY_REGULATORY] = CategoryCoverage(
            ConceptCategory.QUALITY_REGULATORY,
            1,
            2,
            50.0,
        )
        report_text = extract_pdf_text(
            generate_pdf_report(
                {"quality control"},
                ["process validation"],
                analysis_mode="Skills-focused analysis",
                category_coverage=categories,
                explanations=[
                    NormalizedMatchExplanation(
                        concept="quality control",
                        resume_term="QC",
                        job_term="quality control",
                    )
                ],
                ordered_matched_keywords=["quality control"],
                primary_coverage=PrimaryCoverage(1, 2, 50.0),
            )
        )
        normalized = " ".join(report_text.split())

        positions = [
            normalized.index(label)
            for label in (
                "Keyword Matching Report",
                "Matched Keywords:",
                "Missing Keywords:",
                "Analysis Mode:",
                "Category Coverage:",
                "Normalized Matches:",
            )
        ]
        self.assertEqual(positions, sorted(positions))
        self.assertIn("Skills-focused analysis", normalized)
        self.assertIn("Primary Categorized Coverage: 50.0%", normalized)
        self.assertIn(
            "Uncategorized concepts are excluded from primary coverage.",
            normalized,
        )
        self.assertIn("Quality/regulatory: 50.0% (1/2)", normalized)
        self.assertIn(
            "Education: N/A — no applicable concepts",
            normalized,
        )
        self.assertIn("QC -> quality control (quality control)", normalized)

    def test_reports_no_categorized_concepts_as_not_applicable(self) -> None:
        categories = {
            category: CategoryCoverage(category, 0, 0, 0)
            for category in ConceptCategory
        }
        report_text = extract_pdf_text(
            generate_pdf_report(
                set(),
                ["unknown"],
                analysis_mode="Skills-focused analysis",
                category_coverage=categories,
                primary_coverage=PrimaryCoverage(0, 0, None),
            )
        )

        self.assertIn(
            "Primary Categorized Coverage: N/A — no categorized concepts",
            " ".join(report_text.split()),
        )

    def test_adds_static_dossier_chrome_and_optional_section_summary(self) -> None:
        report_text = extract_pdf_text(
            generate_pdf_report(
                {"python"},
                ["sql"],
                document_section_summaries=[
                    "Resume 1: skills, experience",
                    "Job description: semantic sections unavailable",
                ],
            )
        )

        normalized = " ".join(report_text.split())
        self.assertIn("RKS // DETERMINISTIC LEXICAL DOSSIER", normalized)
        self.assertIn("Document / Section Summary:", normalized)
        self.assertIn("Resume 1: skills, experience", normalized)
        self.assertIn(
            "Lexical comparison—not a candidate-performance assessment.",
            normalized,
        )


if __name__ == "__main__":
    unittest.main()
