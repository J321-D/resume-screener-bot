"""Longest-first deterministic concept normalization."""

from __future__ import annotations

from collections import OrderedDict

from resume_screener.analysis import TOKEN_PATTERN
from resume_screener.models import NormalizedConcept
from resume_screener.normalization.phrases import (
    MAX_PHRASE_TOKENS,
    MIN_PHRASE_TOKENS,
    PHRASE_MAP,
)
from resume_screener.normalization.stop_words import ENGLISH_STOP_WORDS
from resume_screener.normalization.synonyms import SYNONYM_MAP
from resume_screener.skills.taxonomy import classify_concept


def _concept_for(surface: str) -> str:
    normalized_surface = surface.lower()
    return SYNONYM_MAP.get(
        normalized_surface,
        PHRASE_MAP.get(normalized_surface, normalized_surface),
    )


def normalize_concepts(
    text: str,
    *,
    filter_stop_words: bool = True,
) -> list[NormalizedConcept]:
    """Return unique concepts in first-appearance order.

    Phrase recognition consumes the longest supported two- or three-token span,
    preventing its component tokens from being counted separately for that span.
    The first surface form remains the deterministic display form.
    """
    matches = list(TOKEN_PATTERN.finditer(text.lower()))
    concepts: OrderedDict[str, NormalizedConcept] = OrderedDict()
    index = 0

    while index < len(matches):
        phrase_length = 0
        current_match = matches[index]
        surface = text[current_match.start() : current_match.end()]
        normalized_surface = current_match.group(0)

        for candidate_length in range(MAX_PHRASE_TOKENS, MIN_PHRASE_TOKENS - 1, -1):
            candidate_matches = matches[index : index + candidate_length]
            if len(candidate_matches) != candidate_length:
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
        if not (
            filter_stop_words
            and consumed == 1
            and normalized_surface in ENGLISH_STOP_WORDS
        ):
            existing = concepts.get(concept)
            if existing is None:
                concepts[concept] = NormalizedConcept(
                    concept=concept,
                    display_term=surface,
                    category=classify_concept(concept),
                    count=1,
                )
            else:
                existing.count += 1
        index += consumed

    return list(concepts.values())
