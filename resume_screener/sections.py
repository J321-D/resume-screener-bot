"""Conservative semantic-section detection over canonical extracted text.

Only explicit, documented heading forms are recognized. Parser-backed hints are
preferred; plain text receives a deliberately narrow standalone-line fallback.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from hashlib import sha256
from typing import Literal

from resume_screener.models import DocumentHeadingHint, ExtractedDocument


SectionType = Literal[
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "research",
    "publications",
    "certifications",
    "other",
]

_HEADING_TYPES: dict[str, SectionType] = {
    "summary": "summary",
    "professional summary": "summary",
    "profile": "summary",
    "experience": "experience",
    "work experience": "experience",
    "professional experience": "experience",
    "employment history": "experience",
    "education": "education",
    "skills": "skills",
    "technical skills": "skills",
    "core competencies": "skills",
    "projects": "projects",
    "selected projects": "projects",
    "research": "research",
    "research experience": "research",
    "publications": "publications",
    "certifications": "certifications",
    "licenses and certifications": "certifications",
}
_LINE_PATTERN = re.compile(r"(?m)^(?P<heading>[^\r\n]{1,80})(?P<newline>\r?\n|$)")


@dataclass(frozen=True)
class DetectedSection:
    """One exact half-open section range in canonical source text."""

    section_id: str
    raw_heading: str
    normalized_type: SectionType
    start: int
    end: int
    heading_start: int
    heading_end: int
    detection_method: str


def normalize_heading(raw_heading: str) -> SectionType | None:
    """Map only an explicitly curated heading surface to a section type."""
    normalized = " ".join(raw_heading.strip().removesuffix(":").casefold().split())
    return _HEADING_TYPES.get(normalized)


def _plain_text_hints(text: str) -> list[DocumentHeadingHint]:
    hints: list[DocumentHeadingHint] = []
    for match in _LINE_PATTERN.finditer(text):
        raw = match.group("heading").strip()
        normalized = normalize_heading(raw)
        if normalized is None:
            continue
        # Reject list items and prose-like title-case words embedded in a block.
        if raw.startswith(("-", "*", "•")):
            continue
        line_is_upper = any(character.isalpha() for character in raw) and raw == raw.upper()
        separated = match.start() == 0 or text[max(0, match.start() - 2) : match.start()] in {"\n\n", "\r\n\r\n"}
        if not line_is_upper and not separated:
            continue
        start = match.start("heading") + len(match.group("heading")) - len(match.group("heading").lstrip())
        hints.append(
            DocumentHeadingHint(
                start=start,
                end=start + len(raw),
                raw_heading=raw,
                detection_method="standalone_known_heading",
            )
        )
    return hints


def detect_sections(document: ExtractedDocument, document_id: str) -> list[DetectedSection]:
    """Return exact sections or an empty list when boundaries are not reliable."""
    hints = list(document.heading_hints) or _plain_text_hints(document.text)
    accepted: list[tuple[DocumentHeadingHint, SectionType]] = []
    for hint in sorted(hints, key=lambda item: (item.start, item.end)):
        section_type = normalize_heading(hint.raw_heading)
        if section_type is None:
            continue
        if hint.start < 0 or hint.end > len(document.text):
            continue
        if document.text[hint.start : hint.end] != hint.raw_heading:
            continue
        if accepted and hint.start < accepted[-1][0].end:
            continue
        accepted.append((hint, section_type))

    sections: list[DetectedSection] = []
    for index, (hint, section_type) in enumerate(accepted):
        end = accepted[index + 1][0].start if index + 1 < len(accepted) else len(document.text)
        digest = sha256(
            f"section\x1f{document_id}\x1f{hint.start}\x1f{end}\x1f{section_type}".encode("utf-8")
        ).hexdigest()[:20]
        sections.append(
            DetectedSection(
                section_id=f"section_{digest}",
                raw_heading=hint.raw_heading,
                normalized_type=section_type,
                start=hint.start,
                end=end,
                heading_start=hint.start,
                heading_end=hint.end,
                detection_method=hint.detection_method,
            )
        )
    return sections


def section_for_span(
    sections: list[DetectedSection], start: int, end: int
) -> DetectedSection | None:
    """Return a section only when the complete evidence span is contained."""
    return next(
        (section for section in sections if section.start <= start and end <= section.end),
        None,
    )
