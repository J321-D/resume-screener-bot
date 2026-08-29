"""Unicode-safe PDF report generation for the resume screener application."""

from __future__ import annotations

import fitz

from resume_screener.models import (
    CategoryCoverage,
    ConceptCategory,
    NormalizedMatchExplanation,
    PrimaryCoverage,
)

_FONT_RESOURCE = "china-s"
_PDF_FONT_NAME = "report-font"
_FALLBACK_CHARACTER = "?"
_FONT_SIZE = 12
_LINE_HEIGHT = 18
_PAGE_MARGIN = 36
_INK = (0.10, 0.14, 0.22)
_MUTED = (0.34, 0.40, 0.50)
_ACCENT = (0.06, 0.55, 0.70)
_PANEL = (0.95, 0.97, 0.98)


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
    """Add a static precision-dossier page with a restrained page frame."""
    page_size = fitz.paper_rect("a4")
    page = document.new_page(width=page_size.width, height=page_size.height)
    page.insert_font(fontname=_PDF_FONT_NAME, fontbuffer=font.buffer)
    page.draw_rect(page.rect, color=None, fill=(0.985, 0.99, 1.0))
    page.draw_rect(
        fitz.Rect(
            _PAGE_MARGIN - 10,
            _PAGE_MARGIN - 14,
            page.rect.width - _PAGE_MARGIN + 10,
            page.rect.height - _PAGE_MARGIN + 8,
        ),
        color=(0.82, 0.86, 0.91),
        width=0.6,
    )
    page.draw_line(
        fitz.Point(_PAGE_MARGIN, page.rect.height - _PAGE_MARGIN + 1),
        fitz.Point(page.rect.width - _PAGE_MARGIN, page.rect.height - _PAGE_MARGIN + 1),
        color=(0.76, 0.81, 0.87),
        width=0.5,
    )
    return page


def generate_pdf_report(
    matched_keywords: set[str],
    filtered_missing_keywords: list[str],
    *,
    analysis_mode: str | None = None,
    category_coverage: dict[ConceptCategory, CategoryCoverage] | None = None,
    explanations: list[NormalizedMatchExplanation] | None = None,
    ordered_matched_keywords: list[str] | None = None,
    primary_coverage: PrimaryCoverage | None = None,
    document_section_summaries: list[str] | None = None,
    report_title: str = "Keyword Matching Report",
    matched_label: str = "Matched Keywords",
    missing_label: str = "Missing Keywords",
    additional_sections: list[tuple[str, list[str]]] | None = None,
) -> bytes:
    """Build the current report and return valid, Unicode-capable PDF bytes.

    Droid Sans Fallback is supplied by PyMuPDF/MuPDF. Characters that the font
    does not contain are explicitly replaced with ``?`` so report generation
    remains predictable instead of raising an encoding error.
    """
    font = fitz.Font(fontname=_FONT_RESOURCE)
    title = _replace_unsupported_glyphs(report_title, font)
    matched_for_report = (
        ordered_matched_keywords
        if ordered_matched_keywords is not None
        else sorted(matched_keywords)
    )
    report_lines = [
        _replace_unsupported_glyphs(
            f"{matched_label}: {matched_for_report}", font
        ),
        "",
        _replace_unsupported_glyphs(
            f"{missing_label}: {filtered_missing_keywords[:50]}", font
        ),
    ]
    if analysis_mode is not None:
        report_lines.extend(
            [
                "",
                _replace_unsupported_glyphs(
                    f"Analysis Mode: {analysis_mode}", font
                ),
            ]
        )
    if category_coverage:
        if primary_coverage is not None:
            report_lines.extend(
                [
                    "",
                    _replace_unsupported_glyphs(
                        "Primary Categorized Coverage: "
                        f"{primary_coverage.display_value}",
                        font,
                    ),
                    _replace_unsupported_glyphs(
                        "Uncategorized Lexical Coverage: "
                        f"{category_coverage[ConceptCategory.UNCATEGORIZED].display_value}",
                        font,
                    ),
                    _replace_unsupported_glyphs(
                        "Uncategorized concepts are excluded from primary coverage.",
                        font,
                    ),
                ]
            )
        report_lines.extend(["", "Category Coverage:"])
        for category in ConceptCategory:
            coverage = category_coverage[category]
            category_value = (
                f"{coverage.display_value} "
                f"({coverage.matched}/{coverage.total})"
                if coverage.total
                else coverage.display_value
            )
            report_lines.append(
                _replace_unsupported_glyphs(
                    f"{category.value}: {category_value}", font
                )
            )
    if explanations:
        report_lines.extend(["", "Normalized Matches:"])
        for explanation in explanations:
            report_lines.append(
                _replace_unsupported_glyphs(
                    f"{explanation.resume_term} -> {explanation.job_term} "
                    f"({explanation.concept})",
                    font,
                )
            )
    if additional_sections:
        for section_title, section_lines in additional_sections:
            report_lines.extend(
                ["", _replace_unsupported_glyphs(f"{section_title}:", font)]
            )
            report_lines.extend(
                _replace_unsupported_glyphs(line, font)
                for line in section_lines
            )
    if document_section_summaries:
        report_lines.extend(["", "Document / Section Summary:"])
        report_lines.extend(
            _replace_unsupported_glyphs(summary, font)
            for summary in document_section_summaries
        )

    with fitz.open() as document:
        page = _add_page(document, font)
        content_width = page.rect.width - (2 * _PAGE_MARGIN)
        title_size = 21
        title_width = font.text_length(title, fontsize=title_size)
        title_x = max(_PAGE_MARGIN, (page.rect.width - title_width) / 2)
        header_panel_bottom = _PAGE_MARGIN + 68
        y_position = _PAGE_MARGIN + 40
        page.draw_rect(
            fitz.Rect(
                _PAGE_MARGIN,
                _PAGE_MARGIN - 4,
                page.rect.width - _PAGE_MARGIN,
                header_panel_bottom,
            ),
            color=None,
            fill=_PANEL,
        )
        page.insert_text(
            (_PAGE_MARGIN + 10, _PAGE_MARGIN + 8),
            "RKS // DETERMINISTIC LEXICAL DOSSIER",
            fontname=_PDF_FONT_NAME,
            fontsize=7,
            color=_ACCENT,
        )
        page.insert_text(
            (title_x, y_position),
            title,
            fontname=_PDF_FONT_NAME,
            fontsize=title_size,
            color=_INK,
        )
        y_position = header_panel_bottom + _LINE_HEIGHT + 8

        for logical_line in report_lines:
            for line in _wrap_line(logical_line, font, content_width):
                if y_position > page.rect.height - _PAGE_MARGIN:
                    page = _add_page(document, font)
                    y_position = _PAGE_MARGIN + _FONT_SIZE
                if line:
                    is_section = line.endswith(":") and not line.startswith(
                        ("Matched Keywords", "Missing Keywords", "Analysis Mode")
                    )
                    if is_section:
                        y_position += 4
                        page.draw_line(
                            fitz.Point(_PAGE_MARGIN, y_position - 11),
                            fitz.Point(
                                page.rect.width - _PAGE_MARGIN,
                                y_position - 11,
                            ),
                            color=(0.80, 0.85, 0.90),
                            width=0.5,
                        )
                    page.insert_text(
                        (_PAGE_MARGIN, y_position),
                        line,
                        fontname=_PDF_FONT_NAME,
                        fontsize=_FONT_SIZE,
                        color=_ACCENT if is_section else _INK,
                    )
                y_position += _LINE_HEIGHT

        for page_number, report_page in enumerate(document, start=1):
            report_page.insert_text(
                (_PAGE_MARGIN, report_page.rect.height - _PAGE_MARGIN + 14),
                "Lexical comparison—not a candidate-performance assessment.",
                fontname=_PDF_FONT_NAME,
                fontsize=7,
                color=_MUTED,
            )
            page_label = f"{page_number:02d} / {len(document):02d}"
            report_page.insert_text(
                (
                    report_page.rect.width
                    - _PAGE_MARGIN
                    - font.text_length(page_label, fontsize=7),
                    report_page.rect.height - _PAGE_MARGIN + 14,
                ),
                page_label,
                fontname=_PDF_FONT_NAME,
                fontsize=7,
                color=_MUTED,
            )

        document.subset_fonts()
        return document.tobytes(garbage=4, deflate=True)
