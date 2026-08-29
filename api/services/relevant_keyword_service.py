"""Derive deterministic, curated keyword-review findings without changing raw scoring."""

from __future__ import annotations

from collections import defaultdict
from hashlib import sha256
from typing import Literal

from api.schemas_v2 import RelevantKeywordEvidence, RelevantKeywordResponse, SourceSpan
from api.services.document_service import PreparedDocuments
from resume_screener.models import ConceptCategory, ExtractedDocument
from resume_screener.normalization.matcher import normalize_concept_occurrences
from resume_screener.normalization.phrases import PHRASE_MAP
from resume_screener.normalization.synonyms import SYNONYM_MAP


SourceKind = Literal["resume", "job_description"]


def _stable_keyword_id(normalized_term: str) -> str:
    digest = sha256(f"relevant_keyword\x1f{normalized_term}".encode("utf-8")).hexdigest()
    return f"relevant_{digest[:20]}"


def _document_occurrences(
    documents: PreparedDocuments,
) -> dict[str, list[RelevantKeywordEvidence]]:
    evidence: dict[str, list[RelevantKeywordEvidence]] = defaultdict(list)
    grouped: tuple[tuple[SourceKind, list[ExtractedDocument]], ...] = (
        ("resume", documents.resumes),
        ("job_description", [documents.job_description]),
    )
    for source_document, items in grouped:
        for position, document in enumerate(items, start=1):
            document_id = f"{source_document}_{position}"
            for occurrence in normalize_concept_occurrences(document.text):
                if occurrence.category is ConceptCategory.UNCATEGORIZED:
                    continue
                evidence[occurrence.concept].append(
                    RelevantKeywordEvidence(
                        source_document=source_document,
                        document_id=document_id,
                        source_span=SourceSpan(
                            start=occurrence.start,
                            end=occurrence.end,
                        ),
                        matched_surface=document.text[occurrence.start : occurrence.end],
                    )
                )
    return evidence


def _match_method(
    normalized_term: str,
    evidence: list[RelevantKeywordEvidence],
    status: Literal["matched", "missing"],
) -> Literal["exact", "documented_phrase", "curated_synonym", "not_detected"]:
    if status == "missing":
        return "not_detected"
    resume_surfaces = {
        item.matched_surface.casefold()
        for item in evidence
        if item.source_document == "resume"
    }
    if normalized_term in resume_surfaces:
        return "exact"
    if any(SYNONYM_MAP.get(surface) == normalized_term for surface in resume_surfaces):
        return "curated_synonym"
    if any(PHRASE_MAP.get(surface) == normalized_term for surface in resume_surfaces):
        return "documented_phrase"
    return "exact"


def build_relevant_keywords(documents: PreparedDocuments) -> list[RelevantKeywordResponse]:
    """Return categorized JD concepts with exact source spans and résumé status.

    This additive review layer does not alter Skills-focused or Full lexical scores.
    It intentionally excludes ``Uncategorized`` concepts so generic raw JD tokens
    cannot be presented as résumé skills merely because they are unmatched.
    """
    evidence_by_concept = _document_occurrences(documents)
    job_occurrences = normalize_concept_occurrences(documents.job_description.text)
    ordered_concepts: list[tuple[str, str, ConceptCategory]] = []
    seen: set[str] = set()
    for occurrence in job_occurrences:
        if occurrence.category is ConceptCategory.UNCATEGORIZED:
            continue
        if occurrence.concept in seen:
            continue
        seen.add(occurrence.concept)
        ordered_concepts.append(
            (occurrence.concept, occurrence.surface_term, occurrence.category)
        )

    results: list[RelevantKeywordResponse] = []
    for normalized_term, display_term, category in ordered_concepts:
        all_evidence = evidence_by_concept.get(normalized_term, [])
        resume_evidence = [
            item for item in all_evidence if item.source_document == "resume"
        ]
        job_evidence = [
            item for item in all_evidence if item.source_document == "job_description"
        ]
        status: Literal["matched", "missing"] = (
            "matched" if resume_evidence else "missing"
        )
        evidence = (
            [*resume_evidence, *job_evidence] if status == "matched" else job_evidence
        )
        results.append(
            RelevantKeywordResponse(
                keyword_id=_stable_keyword_id(normalized_term),
                category=category.value,
                status=status,
                display_term=display_term,
                normalized_term=normalized_term,
                match_method=_match_method(normalized_term, evidence, status),
                evidence=evidence,
            )
        )
    return results
