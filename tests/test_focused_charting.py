"""Tests for deterministic focused chart preparation."""

from __future__ import annotations

import unittest

from resume_screener.models import ConceptCategory, NormalizedConcept
from resume_screener.skills.charting import prepare_focused_chart_items


def concept(name: str, count: int = 1) -> NormalizedConcept:
    return NormalizedConcept(name, name, ConceptCategory.TOOLS_SOFTWARE, count)


class FocusedChartingTests(unittest.TestCase):
    def test_ranks_missing_before_matched_by_frequency_then_source_order(self) -> None:
        items = [concept("python", 2), concept("sql", 2), concept("c++", 4)]

        chart = prepare_focused_chart_items(items, {"python"})

        self.assertEqual(
            [(item.display_term, item.state) for item in chart],
            [("c++", "Missing"), ("sql", "Missing"), ("python", "Matched")],
        )

    def test_limits_after_ranking_and_excludes_uncategorized(self) -> None:
        items = [concept(f"skill{index}", index + 1) for index in range(30)]
        items.append(
            NormalizedConcept(
                "unknown", "unknown", ConceptCategory.UNCATEGORIZED, 100
            )
        )

        chart = prepare_focused_chart_items(items, set())

        self.assertEqual(len(chart), 25)
        self.assertEqual(chart[0].display_term, "skill29")
        self.assertNotIn("unknown", {item.display_term for item in chart})


if __name__ == "__main__":
    unittest.main()
