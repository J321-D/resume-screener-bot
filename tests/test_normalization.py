"""Tests for narrow deterministic concept normalization."""

from __future__ import annotations

import unittest

from resume_screener.analysis import extract_keywords
from resume_screener.models import ConceptCategory
from resume_screener.normalization.matcher import normalize_concepts
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

    def test_prefers_longest_phrase_and_does_not_double_count_components(self) -> None:
        concepts = normalize_concepts("root cause analysis root cause")

        self.assertEqual(
            [(item.concept, item.count) for item in concepts],
            [("root cause analysis", 1), ("root cause", 1)],
        )
        self.assertNotIn("analysis", {item.concept for item in concepts})

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


if __name__ == "__main__":
    unittest.main()
