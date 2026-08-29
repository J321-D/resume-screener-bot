"""Longest-first deterministic concept normalization."""

from __future__ import annotations

import re
from collections import OrderedDict

from resume_screener.analysis import TOKEN_PATTERN
from resume_screener.models import (
    ConceptCategory,
    NormalizedConcept,
    NormalizedConceptOccurrence,
)
from resume_screener.normalization.phrases import (
    MAX_PHRASE_TOKENS,
    MIN_PHRASE_TOKENS,
    PHRASE_MAP,
)
from resume_screener.normalization.stop_words import (
    FOCUSED_GENERIC_TERMS,
    STANDARD_STOP_WORDS,
)
from resume_screener.normalization.synonyms import SYNONYM_MAP
from resume_screener.skills.taxonomy import classify_concept


def _concept_for(surface: str) -> str:
    normalized_surface = surface.lower()
    return SYNONYM_MAP.get(
        normalized_surface,
        PHRASE_MAP.get(normalized_surface, normalized_surface),
    )


_POSSESSIVE_SUFFIX = re.compile(r"(?<=\w)['’]s\b", re.IGNORECASE)
_R_AND_D = re.compile(r"(?<!\w)r\s*&\s*d(?!\w)", re.IGNORECASE)


def _without_r_and_d_abbreviation(text: str) -> str:
    """Blank R&D abbreviations without changing source offsets."""
    return _R_AND_D.sub(lambda match: " " * len(match.group(0)), text)


def _without_possessive_suffixes(text: str) -> str:
    """Remove possessive suffixes while keeping every source offset stable."""
    return _POSSESSIVE_SUFFIX.sub(lambda match: " " * len(match.group(0)), text)


def _lower_with_source_offsets(text: str) -> tuple[str, list[int]]:
    """Lower text exactly as before while mapping each result code point back."""
    lowered_parts: list[str] = []
    source_offsets: list[int] = []
    for source_offset, character in enumerate(text):
        lowered = character.lower()
        lowered_parts.append(lowered)
        source_offsets.extend([source_offset] * len(lowered))
    return "".join(lowered_parts), source_offsets


def _source_span(
    match: re.Match[str],
    source_offsets: list[int],
) -> tuple[int, int]:
    return source_offsets[match.start()], source_offsets[match.end() - 1] + 1


def _is_contiguous_phrase(text: str, candidate_matches: list[re.Match[str]]) -> bool:
    """Permit phrase recognition only across whitespace, not punctuation."""
    return all(
        text[left.end() : right.start()].isspace()
        for left, right in zip(candidate_matches, candidate_matches[1:])
    )


def _is_parenthetical_repeat(
    text: str,
    previous_end: int | None,
    current_match: re.Match[str],
    concept: str,
    previous_concept: str | None,
) -> bool:
    """Identify ``long phrase (ABBR)`` as one occurrence of one concept."""
    if previous_end is None or concept != previous_concept:
        return False
    before = text[previous_end : current_match.start()]
    after = text[current_match.end() :]
    return bool(re.fullmatch(r"\s*\(\s*", before) and re.match(r"\s*\)", after))


def normalize_concept_occurrences(
    text: str,
    *,
    filter_stop_words: bool = True,
) -> list[NormalizedConceptOccurrence]:
    """Return accepted concepts with exact half-open canonical-text offsets.

    Phrase recognition consumes the longest supported two- or three-token span,
    preventing its component tokens from being emitted separately for that span.
    Offsets use Python Unicode code-point indexing and always target ``text``.
    """
    source_stable_text = _without_r_and_d_abbreviation(
        _without_possessive_suffixes(text)
    )
    normalized_text, source_offsets = _lower_with_source_offsets(source_stable_text)
    matches = list(TOKEN_PATTERN.finditer(normalized_text))
    occurrences: list[NormalizedConceptOccurrence] = []
    index = 0
    previous_concept: str | None = None
    previous_end: int | None = None

    while index < len(matches):
        phrase_length = 0
        current_match = matches[index]
        surface_start, surface_end = _source_span(current_match, source_offsets)
        surface = text[surface_start:surface_end]
        normalized_surface = current_match.group(0)

        for candidate_length in range(MAX_PHRASE_TOKENS, MIN_PHRASE_TOKENS - 1, -1):
            candidate_matches = matches[index : index + candidate_length]
            if len(candidate_matches) != candidate_length:
                continue
            if not _is_contiguous_phrase(normalized_text, candidate_matches):
                continue
            candidate = " ".join(match.group(0).lower() for match in candidate_matches)
            if candidate in PHRASE_MAP or candidate in SYNONYM_MAP:
                phrase_length = candidate_length
                surface = " ".join(
                    text[start:end]
                    for start, end in (
                        _source_span(match, source_offsets)
                        for match in candidate_matches
                    )
                )
                normalized_surface = candidate
                break

        consumed = phrase_length or 1
        concept = _concept_for(normalized_surface)
        category = classify_concept(concept)
        excluded_single_term = (
            consumed == 1
            and (
                normalized_surface in STANDARD_STOP_WORDS
                or (
                    normalized_surface in FOCUSED_GENERIC_TERMS
                    and category is ConceptCategory.UNCATEGORIZED
                )
            )
        )
        current_end = matches[index + consumed - 1].end()
        parenthetical_repeat = consumed == 1 and _is_parenthetical_repeat(
            normalized_text,
            previous_end,
            current_match,
            concept,
            previous_concept,
        )
        if not (filter_stop_words and excluded_single_term) and not parenthetical_repeat:
            occurrence_start, _ = _source_span(current_match, source_offsets)
            _, occurrence_end = _source_span(
                matches[index + consumed - 1],
                source_offsets,
            )
            occurrences.append(
                NormalizedConceptOccurrence(
                    concept=concept,
                    surface_term=surface,
                    category=category,
                    start=occurrence_start,
                    end=occurrence_end,
                )
            )
            previous_concept = concept
            previous_end = current_end
        elif not (filter_stop_words and excluded_single_term):
            previous_concept = concept
            previous_end = current_end
        index += consumed

    return occurrences


def normalize_concepts(
    text: str,
    *,
    filter_stop_words: bool = True,
) -> list[NormalizedConcept]:
    """Return unique concepts in first-appearance order.

    This remains the established v1 normalization path. The separate occurrence
    scanner adds authoritative offsets without changing these display semantics.
    """
    normalized_text = _without_r_and_d_abbreviation(
        _without_possessive_suffixes(text)
    )
    matches = list(TOKEN_PATTERN.finditer(normalized_text.lower()))
    concepts: OrderedDict[str, NormalizedConcept] = OrderedDict()
    index = 0
    previous_concept: str | None = None
    previous_end: int | None = None

    while index < len(matches):
        phrase_length = 0
        current_match = matches[index]
        surface = text[current_match.start() : current_match.end()]
        normalized_surface = current_match.group(0)

        for candidate_length in range(MAX_PHRASE_TOKENS, MIN_PHRASE_TOKENS - 1, -1):
            candidate_matches = matches[index : index + candidate_length]
            if len(candidate_matches) != candidate_length:
                continue
            if not _is_contiguous_phrase(normalized_text, candidate_matches):
                continue
            candidate = " ".join(match.group(0).lower() for match in candidate_matches)
            if candidate in PHRASE_MAP or candidate in SYNONYM_MAP:
                phrase_length = candidate_length
                surface = " ".join(
                    text[match.start() : match.end()] for match in candidate_matches
                )
                normalized_surface = candidate
                break

        consumed = phrase_length or 1
        concept = _concept_for(normalized_surface)
        category = classify_concept(concept)
        excluded_single_term = (
            consumed == 1
            and (
                normalized_surface in STANDARD_STOP_WORDS
                or (
                    normalized_surface in FOCUSED_GENERIC_TERMS
                    and category is ConceptCategory.UNCATEGORIZED
                )
            )
        )
        current_end = matches[index + consumed - 1].end()
        parenthetical_repeat = consumed == 1 and _is_parenthetical_repeat(
            normalized_text,
            previous_end,
            current_match,
            concept,
            previous_concept,
        )
        if not (filter_stop_words and excluded_single_term) and not parenthetical_repeat:
            existing = concepts.get(concept)
            if existing is None:
                concepts[concept] = NormalizedConcept(
                    concept=concept,
                    display_term=surface,
                    category=category,
                    count=1,
                )
            else:
                existing.count += 1
            previous_concept = concept
            previous_end = current_end
        elif not (filter_stop_words and excluded_single_term):
            previous_concept = concept
            previous_end = current_end
        index += consumed

    return list(concepts.values())
