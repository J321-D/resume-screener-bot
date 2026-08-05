"""Characterization tests for baseline PDF report preparation."""

from __future__ import annotations

import unittest
from unittest.mock import patch

import fitz

from resume_screener.reporting import generate_pdf_report


class RecordingPDF:
    """Record the FPDF contract while allowing link preparation to complete."""

    latest: RecordingPDF | None = None

    def __init__(self) -> None:
        self.calls: list[tuple[object, ...]] = []
        RecordingPDF.latest = self

    def add_page(self) -> None:
        self.calls.append(("add_page",))

    def set_font(self, family: str, *, size: int) -> None:
        self.calls.append(("set_font", family, size))

    def cell(
        self,
        width: int,
        height: int,
        *,
        txt: str,
        ln: bool,
        align: str,
    ) -> None:
        self.calls.append(("cell", width, height, txt, ln, align))

    def ln(self, height: int) -> None:
        self.calls.append(("ln", height))

    def multi_cell(self, width: int, height: int, text: str) -> None:
        self.calls.append(("multi_cell", width, height, text))

    def output(self) -> bytearray:
        self.calls.append(("output",))
        return bytearray(b"pdf-bytes")


class GeneratePdfReportTests(unittest.TestCase):
    def test_preserves_report_content_order_formatting_and_truncation(self) -> None:
        missing_keywords = [f"missing{index}" for index in range(51)]

        with patch("resume_screener.reporting.FPDF", RecordingPDF):
            pdf_bytes = generate_pdf_report(
                {"sql", "python"},
                missing_keywords,
            )

        pdf = RecordingPDF.latest
        self.assertIsNotNone(pdf)
        self.assertEqual(
            pdf.calls,
            [
                ("add_page",),
                ("set_font", "Arial", 12),
                ("cell", 200, 10, "Keyword Matching Report", True, "C"),
                ("ln", 10),
                (
                    "multi_cell",
                    0,
                    10,
                    "Matched Keywords: ['python', 'sql']\n\n"
                    f"Missing Keywords: {missing_keywords[:50]}",
                ),
                ("output",),
            ],
        )
        self.assertEqual(pdf_bytes, b"pdf-bytes")

    def test_generates_valid_pdf_bytes_with_current_fpdf(self) -> None:
        pdf_bytes = generate_pdf_report(
            {"sql", "python"},
            ["matlab"],
        )

        self.assertIs(type(pdf_bytes), bytes)
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))
        self.assertIn(b"%%EOF", pdf_bytes[-16:])

        with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
            self.assertEqual(document.page_count, 1)
            report_text = "".join(page.get_text() for page in document)

        self.assertIn("Keyword Matching Report", report_text)
        self.assertIn("Matched Keywords: ['python', 'sql']", report_text)
        self.assertIn("Missing Keywords: ['matlab']", report_text)


if __name__ == "__main__":
    unittest.main()
