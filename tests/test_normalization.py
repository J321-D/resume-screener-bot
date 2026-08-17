"""Tests for narrow deterministic concept normalization."""

from __future__ import annotations

import unittest

from resume_screener.analysis import extract_keywords
from resume_screener.models import ConceptCategory
from resume_screener.normalization.matcher import (
    normalize_concept_occurrences,
    normalize_concepts,
)
from resume_screener.normalization.stop_words import ENGLISH_STOP_WORDS


class ConceptNormalizationTests(unittest.TestCase):
    def test_skills_focused_mode_removes_configured_stop_words(self) -> None:
        excluded = {"a", "the", "and", "to", "of", "in", "with", "we", "are"}
        concepts = normalize_concepts(
            "A role in which we are working with the team and tools"
        )

        self.assertTrue(excluded.issubset(ENGLISH_STOP_WORDS))
        self.assertTrue(excluded.isdisjoint({item.concept for item in concepts}))

    def test_stop_word_filter_is_configurable(self) -> None:
        concepts = normalize_concepts("the and python", filter_stop_words=False)

        self.assertEqual([item.concept for item in concepts], ["the", "and", "python"])

    def test_full_lexical_tokenizer_remains_unchanged(self) -> None:
        self.assertEqual(
            extract_keywords("a the and to of in with we are"),
            {"a", "the", "and", "to", "of", "in", "with", "we", "are"},
        )
        self.assertEqual(
            extract_keywords("Bachelor's candidate’s"),
            {"bachelor", "s", "candidate"},
        )

    def test_prefers_longest_phrase_and_does_not_double_count_components(self) -> None:
        concepts = normalize_concepts("root cause analysis root cause")

        self.assertEqual(
            [(item.concept, item.count) for item in concepts],
            [("root cause analysis", 1), ("root cause", 1)],
        )
        self.assertNotIn("analysis", {item.concept for item in concepts})

    def test_phrase_and_parenthetical_abbreviation_are_one_occurrence(self) -> None:
        concepts = normalize_concepts(
            "Standard Operating Procedures (SOP) and standard"
        )

        self.assertEqual(
            [(item.concept, item.count) for item in concepts],
            [("standard operating procedure", 1), ("standard", 1)],
        )

    def test_parenthetical_synonyms_do_not_inflate_phrase_counts(self) -> None:
        concepts = normalize_concepts(
            "Quality Control (QC), Quality Assurance (QA), "
            "and Design of Experiments (DOE)"
        )

        self.assertEqual(
            [(item.concept, item.count) for item in concepts],
            [
                ("quality control", 1),
                ("quality assurance", 1),
                ("design of experiments", 1),
            ],
        )

    def test_removes_straight_and_curly_possessive_suffixes(self) -> None:
        concepts = normalize_concepts("Bachelor's candidate’s Python's")

        self.assertEqual(
            [item.concept for item in concepts],
            ["bachelor", "python"],
        )
        self.assertNotIn("s", {item.concept for item in concepts})

    def test_filters_generic_focused_terms_but_keeps_categorized_actions(self) -> None:
        concepts = normalize_concepts(
            "The candidate has responsibilities to perform work and led "
            "technical writing with Python unknown-platform"
        )

        self.assertEqual(
            [item.concept for item in concepts],
            ["led", "technical writing", "python", "unknown-platform"],
        )

    def test_preserves_curated_technical_phrases_while_filtering_headings(self) -> None:
        concepts = normalize_concepts(
            "Responsibilities Required Qualifications Preferred: process validation, "
            "equipment qualification, root cause analysis, risk assessment, "
            "design of experiments, electronic batch records, statistical analysis, "
            "continuous improvement"
        )

        self.assertEqual(
            [item.concept for item in concepts],
            [
                "process validation",
                "equipment qualification",
                "root cause analysis",
                "risk assessment",
                "design of experiments",
                "electronic batch record",
                "statistical analysis",
                "continuous improvement",
            ],
        )

    def test_normalizes_only_curated_synonyms_and_preserves_first_surface(self) -> None:
        concepts = normalize_concepts("QC quality control unrelated-tools")

        self.assertEqual(concepts[0].concept, "quality control")
        self.assertEqual(concepts[0].display_term, "QC")
        self.assertEqual(concepts[0].count, 2)
        self.assertEqual(concepts[1].concept, "unrelated-tools")
        self.assertEqual(concepts[1].category, ConceptCategory.UNCATEGORIZED)

    def test_preserves_technical_punctuation_and_hyphenated_terms(self) -> None:
        concepts = normalize_concepts(
            "C++ C# .NET Node.js cell-culture machine-learning real-time"
        )

        self.assertEqual(
            [item.concept for item in concepts],
            [
                "c++",
                "c#",
                ".net",
                "node.js",
                "cell culture",
                "machine learning",
                "real time",
            ],
        )

    def test_results_are_deterministic_across_repeated_runs(self) -> None:
        text = "QC root cause analysis C++ unknown-term"
        expected = normalize_concepts(text)

        for _ in range(10):
            self.assertEqual(normalize_concepts(text), expected)

    def test_occurrences_preserve_exact_phrase_and_unicode_offsets(self) -> None:
        text = "✨ QC then Quality Control; cell-culture 品質"
        occurrences = normalize_concept_occurrences(text)

        self.assertEqual(
            [text[item.start : item.end] for item in occurrences],
            ["QC", "Quality Control", "cell-culture", "品質"],
        )
        self.assertEqual(
            [item.concept for item in occurrences],
            ["quality control", "quality control", "cell culture", "品質"],
        )


if __name__ == "__main__":
    unittest.main()
