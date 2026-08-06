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

        self.assertEqual(result.overall_score, 28.6)
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


if __name__ == "__main__":
    unittest.main()
