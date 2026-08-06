"""Unicode-safe PDF report generation for the resume screener application."""

from __future__ import annotations

import fitz

_FONT_RESOURCE = "china-s"
_PDF_FONT_NAME = "report-font"
_FALLBACK_CHARACTER = "?"
_FONT_SIZE = 12
_LINE_HEIGHT = 18
_PAGE_MARGIN = 36


def _replace_unsupported_glyphs(text: str, font: fitz.Font) -> str:
    """Replace characters absent from the report font instead of failing."""
    return "".join(
        character
        if character in "\n\r\t" or font.has_glyph(ord(character))
        else _FALLBACK_CHARACTER
        for character in text
    )


def _wrap_line(
    text: str,
    font: fitz.Font,
    maximum_width: float,
) -> list[str]:
    """Wrap one logical line, preferring spaces while supporting CJK text."""
    if not text:
        return [""]

    wrapped_lines: list[str] = []
    remaining = text
    while font.text_length(remaining, fontsize=_FONT_SIZE) > maximum_width:
        fitting_length = 0
        last_space = 0
        for index, character in enumerate(remaining, start=1):
            if font.text_length(remaining[:index], fontsize=_FONT_SIZE) > maximum_width:
                break
            fitting_length = index
            if character == " ":
                last_space = index

        split_at = last_space or max(fitting_length, 1)
        wrapped_lines.append(remaining[:split_at].rstrip())
        remaining = remaining[split_at:].lstrip()

    wrapped_lines.append(remaining)
    return wrapped_lines


def _add_page(document: fitz.Document, font: fitz.Font) -> fitz.Page:
    """Add an A4 page and make the dependency-provided font available on it."""
    page_size = fitz.paper_rect("a4")
    page = document.new_page(width=page_size.width, height=page_size.height)
    page.insert_font(fontname=_PDF_FONT_NAME, fontbuffer=font.buffer)
    return page


def generate_pdf_report(
    matched_keywords: set[str],
    filtered_missing_keywords: list[str],
) -> bytes:
    """Build the current report and return valid, Unicode-capable PDF bytes.

    Droid Sans Fallback is supplied by PyMuPDF/MuPDF. Characters that the font
    does not contain are explicitly replaced with ``?`` so report generation
    remains predictable instead of raising an encoding error.
    """
    font = fitz.Font(fontname=_FONT_RESOURCE)
    title = _replace_unsupported_glyphs("Keyword Matching Report", font)
    report_lines = [
        _replace_unsupported_glyphs(
            f"Matched Keywords: {sorted(matched_keywords)}", font
        ),
        "",
        _replace_unsupported_glyphs(
            f"Missing Keywords: {filtered_missing_keywords[:50]}", font
        ),
    ]

    with fitz.open() as document:
        page = _add_page(document, font)
        content_width = page.rect.width - (2 * _PAGE_MARGIN)
        title_width = font.text_length(title, fontsize=_FONT_SIZE)
        title_x = max(_PAGE_MARGIN, (page.rect.width - title_width) / 2)
        y_position = _PAGE_MARGIN + _FONT_SIZE
        page.insert_text(
            (title_x, y_position),
            title,
            fontname=_PDF_FONT_NAME,
            fontsize=_FONT_SIZE,
        )
        y_position += 2 * _LINE_HEIGHT

        for logical_line in report_lines:
            for line in _wrap_line(logical_line, font, content_width):
                if y_position > page.rect.height - _PAGE_MARGIN:
                    page = _add_page(document, font)
                    y_position = _PAGE_MARGIN + _FONT_SIZE
                if line:
                    page.insert_text(
                        (_PAGE_MARGIN, y_position),
                        line,
                        fontname=_PDF_FONT_NAME,
                        fontsize=_FONT_SIZE,
                    )
                y_position += _LINE_HEIGHT

        document.subset_fonts()
        return document.tobytes(garbage=4, deflate=True)
