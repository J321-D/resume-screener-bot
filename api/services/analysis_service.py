"""API orchestration that delegates every calculation to the existing engine."""

from __future__ import annotations

from datetime import datetime, timezone

from api.schemas import (
    AnalysisMetadata,
    AnalysisResponse,
    CategoryCoverageResponse,
    CoverageSummary,
    ErrorDetail,
    NormalizedMatchResponse,
    TermResult,
)
from api.services.document_service import PreparedDocuments
from resume_screener.analysis import (
    aggregate_resume_words,
    calculate_match_score,
    calculate_matched_words,
    calculate_missing_words,
    extract_keywords,
    rank_missing_keywords,
)
from resume_screener.models import AnalysisMode, ConceptCategory
from resume_screener.skills.matcher import analyze_skills_focused


def _metadata(documents: PreparedDocuments) -> AnalysisMetadata:
    return AnalysisMetadata(
        resume_label=documents.resume_label,
        resume_count=len(documents.resumes),
        input_mode=documents.input_mode,
        analyzed_at=datetime.now(timezone.utc),
    )


def _warnings(documents: PreparedDocuments) -> list[ErrorDetail]:
    return [
        ErrorDetail(code=item.code, message=item.message, field=item.field)
        for item in documents.warnings
    ]


def analyze_documents(
    documents: PreparedDocuments,
    analysis_mode: AnalysisMode,
) -> AnalysisResponse:
    """Produce API output without implementing any analysis rules here."""
    resume_texts = [document.text for document in documents.resumes]
    job_text = documents.job_description.text

    if analysis_mode is AnalysisMode.FULL_LEXICAL:
        resume_words = aggregate_resume_words(resume_texts)
        job_words = extract_keywords(job_text)
        matched = calculate_matched_words(resume_words, job_words)
        missing = calculate_missing_words(resume_words, job_words)
        score = calculate_match_score(matched, job_words)
        ranking = rank_missing_keywords(job_text, missing, "")
        ordered_matched = sorted(matched, key=lambda word: (-len(word), word))
        return AnalysisResponse(
            analysis_mode=analysis_mode,
            coverage=CoverageSummary(
                score=score,
                matched=len(matched),
                missing=len(missing),
                total=len(job_words),
                label="Keyword Coverage",
            ),
            matched_terms=[TermResult(term=term) for term in ordered_matched],
            missing_terms=[
                TermResult(term=term, count=ranking.counts[term])
                for term in ranking.filtered
            ],
            metadata=_metadata(documents),
            warnings=_warnings(documents),
        )

    result = analyze_skills_focused(resume_texts, job_text)
    categories = [
        CategoryCoverageResponse(
            category=category.value,
            matched=coverage.matched,
            total=coverage.total,
            score=coverage.score if coverage.total else None,
            display_value=coverage.display_value,
            included_in_primary=category is not ConceptCategory.UNCATEGORIZED,
        )
        for category, coverage in result.category_coverage.items()
    ]
    return AnalysisResponse(
        analysis_mode=analysis_mode,
        coverage=CoverageSummary(
            score=result.primary_coverage.score,
            matched=result.primary_coverage.matched,
            missing=result.primary_coverage.total - result.primary_coverage.matched,
            total=result.primary_coverage.total,
            label="Categorized Keyword Coverage",
        ),
        matched_terms=[
            TermResult(
                term=item.display_term,
                count=item.count,
                category=item.category.value,
            )
            for item in result.matched
        ],
        missing_terms=[
            TermResult(
                term=item.display_term,
                count=item.count,
                category=item.category.value,
            )
            for item in sorted(result.missing, key=lambda item: -item.count)
        ],
        categories=categories,
        normalized_matches=[
            NormalizedMatchResponse(
                concept=item.concept,
                resume_term=item.resume_term,
                job_term=item.job_term,
            )
            for item in result.explanations
        ],
        metadata=_metadata(documents),
        warnings=_warnings(documents),
    )
