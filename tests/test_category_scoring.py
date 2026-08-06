"""Tests for category coverage calculations."""

from __future__ import annotations

import unittest

from resume_screener.models import ConceptCategory
from resume_screener.skills.matcher import analyze_skills_focused


class CategoryCoverageTests(unittest.TestCase):
    def test_calculates_unique_concept_category_scores(self) -> None:
        result = analyze_skills_focused(
            ["Python QC"],
            "Python SQL quality control process validation degree led unknown",
        )

        self.assertEqual(result.overall_score, 33.3)
        self.assertEqual(result.primary_coverage.matched, 2)
        self.assertEqual(result.primary_coverage.total, 6)
        self.assertEqual(
            result.category_coverage[ConceptCategory.TOOLS_SOFTWARE].score,
            50.0,
        )
        self.assertEqual(
            result.category_coverage[ConceptCategory.QUALITY_REGULATORY].score,
            50.0,
        )
        self.assertEqual(
            result.category_coverage[ConceptCategory.TECHNICAL_SKILLS].score,
            0.0,
        )
        self.assertEqual(
            result.category_coverage[ConceptCategory.UNCATEGORIZED].score,
            0.0,
        )

    def test_empty_category_is_zero_without_division_error(self) -> None:
        result = analyze_skills_focused(["Python"], "Python")

        self.assertEqual(
            result.category_coverage[ConceptCategory.EDUCATION].score,
            0,
        )

    def test_uncategorized_is_excluded_from_primary_but_reported_separately(self) -> None:
        result = analyze_skills_focused(
            ["Python unknown-one"],
            "Python SQL unknown-one unknown-two",
        )

        self.assertEqual(result.overall_score, 50.0)
        self.assertEqual(result.primary_coverage.display_value, "50.0%")
        uncategorized = result.category_coverage[ConceptCategory.UNCATEGORIZED]
        self.assertEqual((uncategorized.matched, uncategorized.total), (1, 2))
        self.assertEqual(uncategorized.display_value, "50.0%")

    def test_no_categorized_concepts_is_not_applicable(self) -> None:
        result = analyze_skills_focused(["unknown-one"], "unknown-one unknown-two")

        self.assertIsNone(result.overall_score)
        self.assertEqual(
            result.primary_coverage.display_value,
            "N/A — no categorized concepts",
        )


if __name__ == "__main__":
    unittest.main()
