"""Pure PDF report and download-link preparation for the baseline application."""

from __future__ import annotations

import base64

from fpdf import FPDF


def prepare_pdf_download(
    matched_keywords: set[str],
    filtered_missing_keywords: list[str],
) -> str:
    """Build the current report and return its existing HTML download link."""
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, txt="Keyword Matching Report", ln=True, align="C")
    pdf.ln(10)
    pdf.multi_cell(
        0,
        10,
        f"Matched Keywords: {sorted(matched_keywords)}\n\n"
        f"Missing Keywords: {filtered_missing_keywords[:50]}",
    )
    pdf_file = pdf.output(dest="S", format="pdf")
    encoded_pdf = base64.b64encode(pdf_file.encode()).decode()
    return (
        f'<a href="data:file/pdf;base64,{encoded_pdf}" '
        'download="report.pdf">📥 Click here to download PDF</a>'
    )
