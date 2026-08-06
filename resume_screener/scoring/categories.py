"""Pure category coverage calculations."""

from __future__ import annotations

from resume_screener.models import CategoryCoverage, ConceptCategory, NormalizedConcept


def calculate_category_coverage(
    job_concepts: list[NormalizedConcept],
    matched_concepts: set[str],
) -> dict[ConceptCategory, CategoryCoverage]:
    """Calculate one-decimal unique-concept coverage for every category."""
    coverage: dict[ConceptCategory, CategoryCoverage] = {}
    for category in ConceptCategory:
        category_concepts = [
            item.concept for item in job_concepts if item.category is category
        ]
        matched_count = sum(
            concept in matched_concepts for concept in category_concepts
        )
        total_count = len(category_concepts)
        score = round(matched_count / total_count * 100, 1) if total_count else 0
        coverage[category] = CategoryCoverage(
            category=category,
            matched=matched_count,
            total=total_count,
            score=score,
        )
    return coverage
