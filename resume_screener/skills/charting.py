"""Pure deterministic preparation for the focused coverage chart."""

from __future__ import annotations

from resume_screener.models import ConceptCategory, FocusedChartItem, NormalizedConcept


def prepare_focused_chart_items(
    job_concepts: list[NormalizedConcept],
    matched_concepts: set[str],
    *,
    limit: int = 25,
) -> list[FocusedChartItem]:
    """Rank categorized terms with missing first and stable source-order ties."""
    ranked = sorted(
        (
            (index, item)
            for index, item in enumerate(job_concepts)
            if item.category is not ConceptCategory.UNCATEGORIZED
        ),
        key=lambda pair: (
            1 if pair[1].concept in matched_concepts else 0,
            -pair[1].count,
            pair[0],
        ),
    )
    return [
        FocusedChartItem(
            display_term=item.display_term,
            state=("Matched" if item.concept in matched_concepts else "Missing"),
            count=item.count,
        )
        for _, item in ranked[:limit]
    ]
