"""Tests for Unicode-safe PDF report generation."""

from __future__ import annotations

import unittest
import warnings

import fitz

from resume_screener.reporting import generate_pdf_report


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


if __name__ == "__main__":
    unittest.main()
