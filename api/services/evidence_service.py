"""Build privacy-bounded deterministic evidence for the additive v2 API."""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from hashlib import sha256
from typing import Literal

from api.schemas import AnalysisResponse, TermResult
from api.schemas_v2 import (
    AnalysisFindingResponse,
    AnalysisV2Response,
    DiagnosticFindingResponse,
    DocumentBlockResponse,
    DocumentSectionResponse,
    EvidenceReference,
    SectionDetectionMetadata,
    SectionReference,
    SourceDocumentResponse,
    SourceSpan,
    UnknownMetadata,
)
from api.services.document_service import PreparedDocuments
from resume_screener.analysis import TOKEN_PATTERN
from resume_screener.models import AnalysisMode, ExtractedDocument
from resume_screener.sections import DetectedSection, detect_sections, section_for_span
from resume_screener.normalization.matcher import (
    normalize_concept_occurrences,
    normalize_concepts,
)
from resume_screener.normalization.phrases import PHRASE_MAP
from resume_screener.normalization.synonyms import SYNONYM_MAP


SourceKind = Literal["resume", "job_description"]
FindingStatus = Literal["matched", "missing"]
MatchMethod = Literal[
    "exact", "documented_phrase", "curated_synonym", "not_detected"
]
_SOURCE_TOKEN_PATTERN = re.compile(TOKEN_PATTERN.pattern, re.IGNORECASE)
_DOCUMENT_BLOCK_TARGET_CHARACTERS = 1_200


@dataclass(frozen=True)
class _DocumentContext:
    document_id: str
    source_document: SourceKind
    document: ExtractedDocument
    sections: tuple[DetectedSection, ...]


def _stable_id(namespace: str, *parts: str) -> str:
    """Return a deterministic opaque identifier, not an anonymization guarantee."""
    digest = sha256("\x1f".join((namespace, *parts)).encode("utf-8")).hexdigest()
    return f"{namespace}_{digest[:20]}"


def _document_contexts(documents: PreparedDocuments) -> list[_DocumentContext]:
    contexts: list[_DocumentContext] = []
    grouped: tuple[tuple[SourceKind, list[ExtractedDocument]], ...] = (
        ("resume", documents.resumes),
        ("job_description", [documents.job_description]),
    )
    for source_document, items in grouped:
        for position, document in enumerate(items, start=1):
            document_id = f"{source_document}_{position}"
            contexts.append(
                _DocumentContext(
                    document_id=document_id,
                    source_document=source_document,
                    document=document,
                    sections=tuple(detect_sections(document, document_id)),
                )
            )
    return contexts


def _reference(
    context: _DocumentContext,
    *,
    start: int,
    end: int,
    normalized_term: str,
) -> EvidenceReference:
    matched_surface = context.document.text[start:end]
    section = section_for_span(list(context.sections), start, end)
    return EvidenceReference(
        evidence_id=_stable_id(
            "evidence",
            context.document_id,
            str(start),
            str(end),
            normalized_term,
        ),
        source_document=context.source_document,
        document_id=context.document_id,
        source_section=(
            SectionReference(
                section_id=section.section_id,
                raw_heading=section.raw_heading,
                normalized_type=section.normalized_type,
                detection_method=section.detection_method,
            )
            if section is not None
            else UnknownMetadata(unknown_reason="not_detected")
        ),
        source_span=SourceSpan(start=start, end=end),
        matched_surface=matched_surface,
        normalized_term=normalized_term,
    )


def _lexical_evidence(
    contexts: list[_DocumentContext],
) -> dict[str, list[EvidenceReference]]:
    evidence: dict[str, list[EvidenceReference]] = defaultdict(list)
    for context in contexts:
        for match in _SOURCE_TOKEN_PATTERN.finditer(context.document.text):
            normalized_term = match.group(0).lower()
            evidence[normalized_term].append(
                _reference(
                    context,
                    start=match.start(),
                    end=match.end(),
                    normalized_term=normalized_term,
                )
            )
    return evidence


def _focused_evidence(
    contexts: list[_DocumentContext],
) -> dict[str, list[EvidenceReference]]:
    evidence: dict[str, list[EvidenceReference]] = defaultdict(list)
    for context in contexts:
        for occurrence in normalize_concept_occurrences(context.document.text):
            evidence[occurrence.concept].append(
                _reference(
                    context,
                    start=occurrence.start,
                    end=occurrence.end,
                    normalized_term=occurrence.concept,
                )
            )
    return evidence


def _focused_concept_by_display(documents: PreparedDocuments) -> dict[str, str]:
    return {
        item.display_term.casefold(): item.concept
        for item in normalize_concepts(documents.job_description.text)
    }


def _match_method(
    normalized_term: str,
    evidence: list[EvidenceReference],
    status: FindingStatus,
) -> MatchMethod:
    if status == "missing":
        return "not_detected"
    resume_surfaces = {
        item.matched_surface.lower()
        for item in evidence
        if item.source_document == "resume"
    }
    if any(SYNONYM_MAP.get(surface) == normalized_term for surface in resume_surfaces):
        return "curated_synonym"
    if any(PHRASE_MAP.get(surface) == normalized_term for surface in resume_surfaces):
        return "documented_phrase"
    return "exact"


def _finding(
    *,
    mode: AnalysisMode,
    term: TermResult,
    status: FindingStatus,
    evidence_by_term: dict[str, list[EvidenceReference]],
    focused_concepts: dict[str, str],
) -> AnalysisFindingResponse:
    normalized_term = (
        term.term.lower()
        if mode is AnalysisMode.FULL_LEXICAL
        else focused_concepts[term.term.casefold()]
    )
    all_evidence = evidence_by_term.get(normalized_term, [])
    evidence = (
        all_evidence
        if status == "matched"
        else [
            item
            for item in all_evidence
            if item.source_document == "job_description"
        ]
    )
    rule_id: Literal[
        "full_lexical.token_coverage", "skills_focused.concept_coverage"
    ] = (
        "full_lexical.token_coverage"
        if mode is AnalysisMode.FULL_LEXICAL
        else "skills_focused.concept_coverage"
    )
    method = _match_method(normalized_term, evidence, status)
    reason: Literal["exact_match", "curated_normalization", "not_detected"] = (
        "not_detected"
        if status == "missing"
        else "exact_match"
        if method == "exact"
        else "curated_normalization"
    )
    return AnalysisFindingResponse(
        finding_id=_stable_id("finding", rule_id, normalized_term),
        comparison_key=f"{rule_id}:{normalized_term}",
        rule_id=rule_id,
        category=term.category,
        status=status,
        reason=reason,
        display_term=term.term,
        normalized_term=normalized_term,
        match_method=method,
        evidence=evidence,
        unavailable_evidence_reason="not_detected" if not evidence else None,
    )


def _block_ranges(text: str) -> list[tuple[int, int]]:
    """Partition canonical text without changing or omitting any character."""
    ranges: list[tuple[int, int]] = []
    start = 0
    while start < len(text):
        proposed_end = min(start + _DOCUMENT_BLOCK_TARGET_CHARACTERS, len(text))
        end = proposed_end
        if proposed_end < len(text):
            newline = text.rfind("\n", start + 1, proposed_end + 1)
            if newline >= start + 1:
                end = newline + 1
        ranges.append((start, end))
        start = end
    return ranges


def _document_blocks(
    context: _DocumentContext,
    findings: list[AnalysisFindingResponse],
) -> list[DocumentBlockResponse]:
    evidence = [
        item
        for finding in findings
        for item in finding.evidence
        if item.document_id == context.document_id
    ]
    blocks: list[DocumentBlockResponse] = []
    for start, end in _block_ranges(context.document.text):
        evidence_refs = list(
            dict.fromkeys(
                item.evidence_id
                for item in evidence
                if start < item.source_span.end and item.source_span.start < end
            )
        )
        blocks.append(
            DocumentBlockResponse(
                block_id=_stable_id(
                    "block", context.document_id, str(start), str(end)
                ),
                start=start,
                end=end,
                text=context.document.text[start:end],
                block_type=UnknownMetadata(unknown_reason="parser_limitation"),
                evidence_refs=evidence_refs,
            )
        )
    return blocks


def _document_sections(context: _DocumentContext) -> list[DocumentSectionResponse]:
    return [
        DocumentSectionResponse(
            section_id=section.section_id,
            raw_heading=section.raw_heading,
            normalized_type=section.normalized_type,
            detection_method=section.detection_method,
            start=section.start,
            end=section.end,
            heading_span=SourceSpan(
                start=section.heading_start,
                end=section.heading_end,
            ),
        )
        for section in context.sections
    ]


def _diagnostics(
    contexts: list[_DocumentContext],
    analysis: AnalysisResponse,
    findings: list[AnalysisFindingResponse],
) -> list[DiagnosticFindingResponse]:
    """Evaluate only factual rules already supported by request/analysis data."""
    diagnostics: list[DiagnosticFindingResponse] = []
    for context in contexts:
        diagnostics.append(
            DiagnosticFindingResponse(
                diagnostic_id=_stable_id(
                    "diagnostic", "document.text_extracted", context.document_id
                ),
                rule_id="document.text_extracted",
                rule_group="document",
                status="pass",
                reason_code="canonical_text_available",
                source_document_id=context.document_id,
                message=(
                    f"Readable canonical text was extracted from {context.document_id}."
                ),
            )
        )
        if context.sections:
            diagnostics.append(
                DiagnosticFindingResponse(
                    diagnostic_id=_stable_id(
                        "diagnostic", "document.semantic_sections", context.document_id
                    ),
                    rule_id="document.semantic_sections",
                    rule_group="structure",
                    status="pass",
                    reason_code="authoritative_sections_detected",
                    source_document_id=context.document_id,
                    message=f"{len(context.sections)} conservative semantic section(s) were detected.",
                )
            )
            section_types = [section.normalized_type for section in context.sections]
            repeated = sorted(
                section_type
                for section_type in set(section_types)
                if section_types.count(section_type) > 1
            )
            diagnostics.append(
                DiagnosticFindingResponse(
                    diagnostic_id=_stable_id(
                        "diagnostic",
                        "document.repeated_section_type",
                        context.document_id,
                    ),
                    rule_id="document.repeated_section_type",
                    rule_group="structure",
                    status="review" if repeated else "pass",
                    reason_code=(
                        "repeated_section_type_detected"
                        if repeated
                        else "no_repeated_section_type"
                    ),
                    source_document_id=context.document_id,
                    message=(
                        f"Repeated section type(s): {', '.join(repeated)}."
                        if repeated
                        else "No repeated semantic section type was detected."
                    ),
                )
            )
        else:
            diagnostics.append(
                DiagnosticFindingResponse(
                    diagnostic_id=_stable_id(
                        "diagnostic", "document.semantic_sections", context.document_id
                    ),
                    rule_id="document.semantic_sections",
                    rule_group="structure",
                    status="unavailable",
                    reason_code="authoritative_sections_unavailable",
                    source_document_id=context.document_id,
                    message="Semantic sections were not detected reliably for this source.",
                )
            )

    score = analysis.coverage.score
    diagnostics.extend(
        [
            DiagnosticFindingResponse(
                diagnostic_id=_stable_id(
                    "diagnostic", "coverage.threshold_30_percent", str(score)
                ),
                rule_id="coverage.threshold_30_percent",
                rule_group="coverage",
                status="review" if score is not None and score < 30.0 else "pass",
                reason_code=(
                    "coverage_strictly_below_30"
                    if score is not None and score < 30.0
                    else "coverage_not_below_30"
                ),
                message=(
                    "Lexical coverage is strictly below the established 30.0% review boundary."
                    if score is not None and score < 30.0
                    else "Lexical coverage is not below the established 30.0% review boundary."
                ),
            ),
            DiagnosticFindingResponse(
                diagnostic_id=_stable_id(
                    "diagnostic",
                    "coverage.opportunities_present",
                    str(analysis.coverage.missing),
                ),
                rule_id="coverage.opportunities_present",
                rule_group="coverage",
                status="review" if analysis.coverage.missing else "pass",
                reason_code=(
                    "coverage_opportunities_present"
                    if analysis.coverage.missing
                    else "no_coverage_opportunities"
                ),
                evidence_refs=[
                    evidence.evidence_id
                    for finding in findings
                    if finding.status == "missing"
                    for evidence in finding.evidence
                ],
                message=(
                    f"{analysis.coverage.missing} lexical coverage opportunity term(s) require human review."
                    if analysis.coverage.missing
                    else "No lexical coverage opportunity terms were returned."
                ),
            ),
        ]
    )
    return diagnostics


def build_v2_response(
    documents: PreparedDocuments,
    analysis_mode: AnalysisMode,
    analysis: AnalysisResponse,
) -> AnalysisV2Response:
    """Wrap the unchanged v1 result with deterministic bounded provenance."""
    contexts = _document_contexts(documents)
    evidence_by_term = (
        _lexical_evidence(contexts)
        if analysis_mode is AnalysisMode.FULL_LEXICAL
        else _focused_evidence(contexts)
    )
    focused_concepts = (
        _focused_concept_by_display(documents)
        if analysis_mode is AnalysisMode.SKILLS_FOCUSED
        else {}
    )
    findings = [
        _finding(
            mode=analysis_mode,
            term=term,
            status=status,
            evidence_by_term=evidence_by_term,
            focused_concepts=focused_concepts,
        )
        for status, terms in (
            ("matched", analysis.matched_terms),
            ("missing", analysis.missing_terms),
        )
        for term in terms
    ]
    return AnalysisV2Response(
        analysis=analysis,
        source_documents=[
            SourceDocumentResponse(
                document_id=context.document_id,
                source_document=context.source_document,
                media_type=context.document.media_type,
                canonical_text_characters=len(context.document.text),
                document_structure_metadata=(
                    SectionDetectionMetadata(
                        section_count=len(context.sections),
                        detection_methods=list(
                            dict.fromkeys(
                                section.detection_method for section in context.sections
                            )
                        ),
                    )
                    if context.sections
                    else UnknownMetadata(unknown_reason="not_detected")
                ),
                formatting_metadata=UnknownMetadata(
                    unknown_reason="parser_limitation"
                ),
                blocks=_document_blocks(context, findings),
                sections=_document_sections(context),
            )
            for context in contexts
        ],
        findings=findings,
        diagnostics=_diagnostics(contexts, analysis, findings),
    )
