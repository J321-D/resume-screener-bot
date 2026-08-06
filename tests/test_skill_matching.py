"""Tests for deterministic skills-focused matching."""

from __future__ import annotations

import unittest

from resume_screener.models import ConceptCategory
from resume_screener.skills.matcher import analyze_skills_focused
from tests.fixtures.biomedical_documents import (
    BIOMEDICAL_JOB_DESCRIPTION,
    BIOMEDICAL_RESUME,
)


class SkillsFocusedMatchingTests(unittest.TestCase):
    def test_matches_abbreviations_and_explains_surface_forms(self) -> None:
        result = analyze_skills_focused(
            ["QC GMP bioreactors"],
            "quality control gmp bioreactor",
        )

        self.assertEqual(
            [item.concept for item in result.matched],
            [
                "quality control",
                "good manufacturing practice",
                "bioreactor",
            ],
        )
        self.assertEqual(
            [
                (item.resume_term, item.job_term, item.concept)
                for item in result.explanations
            ],
            [
                ("QC", "quality control", "quality control"),
                ("GMP", "gmp", "good manufacturing practice"),
                ("bioreactors", "bioreactor", "bioreactor"),
            ],
        )

    def test_uses_first_job_description_form_for_display(self) -> None:
        result = analyze_skills_focused(["quality control"], "QC quality control")

        self.assertEqual(result.matched[0].display_term, "QC")
        self.assertEqual(len(result.matched), 1)

    def test_biomedical_fixture_keeps_unknowns_and_filters_filler(self) -> None:
        result = analyze_skills_focused(
            [BIOMEDICAL_RESUME], BIOMEDICAL_JOB_DESCRIPTION
        )
        job_names = {item.concept for item in result.job_concepts}

        for filler in ("a", "the", "and", "to", "of", "in", "with", "we", "are"):
            self.assertNotIn(filler, job_names)
        self.assertIn("monitoring", job_names)
        self.assertEqual(
            next(
                item
                for item in result.job_concepts
                if item.concept == "monitoring"
            ).category,
            ConceptCategory.UNCATEGORIZED,
        )
        self.assertTrue(result.matched)
        self.assertTrue(result.missing)

    def test_process_development_fixture_is_clean_and_phrase_safe(self) -> None:
        result = analyze_skills_focused(
            [BIOMEDICAL_RESUME], BIOMEDICAL_JOB_DESCRIPTION
        )
        names = [item.concept for item in result.job_concepts]

        for excluded in (
            "s",
            "standard",
            "operating",
            "procedures",
            "responsibilities",
            "required",
            "qualifications",
            "preferred",
        ):
            self.assertNotIn(excluded, names)
        for phrase in (
            "process validation",
            "equipment qualification",
            "root cause analysis",
            "risk assessment",
            "design of experiments",
            "electronic batch record",
            "standard operating procedure",
        ):
            self.assertIn(phrase, names)
        self.assertEqual(
            result.overall_score,
            round(
                result.primary_coverage.matched
                / result.primary_coverage.total
                * 100,
                1,
            ),
        )

    def test_matching_order_is_repeatable(self) -> None:
        expected = analyze_skills_focused(
            [BIOMEDICAL_RESUME], BIOMEDICAL_JOB_DESCRIPTION
        )

        for _ in range(10):
            actual = analyze_skills_focused(
                [BIOMEDICAL_RESUME], BIOMEDICAL_JOB_DESCRIPTION
            )
            self.assertEqual(actual, expected)


if __name__ == "__main__":
    unittest.main()
