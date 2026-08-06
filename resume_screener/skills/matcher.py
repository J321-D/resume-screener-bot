"""Deterministic skills-focused concept matching."""

from __future__ import annotations

from collections.abc import Iterable

from resume_screener.models import (
    NormalizedMatchExplanation,
    SkillsFocusedResult,
)
from resume_screener.normalization.matcher import normalize_concepts
from resume_screener.scoring.categories import calculate_category_coverage


def analyze_skills_focused(
    resume_texts: Iterable[str],
    job_description_text: str,
) -> SkillsFocusedResult:
    """Compare ordered normalized concepts without probabilistic inference."""
    resume_by_concept = {}
    for resume_text in resume_texts:
        for item in normalize_concepts(resume_text):
            resume_by_concept.setdefault(item.concept, item)

    job_concepts = normalize_concepts(job_description_text)
    matched = [item for item in job_concepts if item.concept in resume_by_concept]
    missing = [item for item in job_concepts if item.concept not in resume_by_concept]
    matched_names = {item.concept for item in matched}
    explanations = []
    for job_item in matched:
        resume_item = resume_by_concept[job_item.concept]
        if (
            resume_item.display_term.lower() != job_item.display_term.lower()
            or job_item.display_term.lower() != job_item.concept
        ):
            explanations.append(
                NormalizedMatchExplanation(
                    concept=job_item.concept,
                    resume_term=resume_item.display_term,
                    job_term=job_item.display_term,
                )
            )

    overall_score = (
        round(len(matched) / len(job_concepts) * 100, 1)
        if job_concepts
        else 0
    )
    return SkillsFocusedResult(
        resume_concepts=list(resume_by_concept.values()),
        job_concepts=job_concepts,
        matched=matched,
        missing=missing,
        explanations=explanations,
        category_coverage=calculate_category_coverage(job_concepts, matched_names),
        overall_score=overall_score,
    )
