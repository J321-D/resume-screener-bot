"""PDF report generation for the resume screener application."""

from __future__ import annotations

from fpdf import FPDF


def generate_pdf_report(
    matched_keywords: set[str],
    filtered_missing_keywords: list[str],
) -> bytes:
    """Build the current report and return valid PDF bytes."""
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
    return bytes(pdf.output())
