"""Characterization tests for baseline PDF report preparation."""

from __future__ import annotations

import unittest
from unittest.mock import patch

from resume_screener.reporting import prepare_pdf_download


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

    def output(self, *, dest: str, format: str) -> str:
        self.calls.append(("output", dest, format))
        return "pdf-bytes"


class PreparePdfDownloadTests(unittest.TestCase):
    def test_preserves_report_content_order_formatting_and_download_link(self) -> None:
        missing_keywords = [f"missing{index}" for index in range(51)]

        with patch("resume_screener.reporting.FPDF", RecordingPDF):
            href = prepare_pdf_download(
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
                ("output", "S", "pdf"),
            ],
        )
        self.assertEqual(
            href,
            '<a href="data:file/pdf;base64,cGRmLWJ5dGVz" '
            'download="report.pdf">📥 Click here to download PDF</a>',
        )

    def test_preserves_current_installed_fpdf_failure(self) -> None:
        with self.assertRaisesRegex(
            TypeError,
            "unexpected keyword argument 'format'",
        ):
            prepare_pdf_download({"python"}, ["sql"])


if __name__ == "__main__":
    unittest.main()
