"""Focused characterization tests for the pure baseline algorithms."""

from __future__ import annotations

import unittest

from resume_screener.analysis import (
    aggregate_resume_words,
    calculate_match_score,
    calculate_matched_words,
    calculate_missing_words,
    extract_keywords,
    rank_missing_keywords,
)


class TokenizerTests(unittest.TestCase):
    def test_preserves_current_technical_term_tokenization(self) -> None:
        self.assertEqual(extract_keywords("C++ C# .NET"), {"c", "net"})

    def test_lowercases_and_returns_unique_word_tokens(self) -> None:
        self.assertEqual(
            extract_keywords("Python, PYTHON and SQL_2!"),
            {"python", "and", "sql_2"},
        )


class ResumeAggregationTests(unittest.TestCase):
    def test_unions_all_resume_keywords_into_one_set(self) -> None:
        self.assertEqual(
            aggregate_resume_words(["Python", "SQL MATLAB", "Python"]),
            {"python", "sql", "matlab"},
        )

    def test_empty_resume_collection_returns_empty_set(self) -> None:
        self.assertEqual(aggregate_resume_words([]), set())


class SetCalculationTests(unittest.TestCase):
    def test_calculates_current_matched_and_missing_sets(self) -> None:
        resume_words = {"python", "sql"}
        job_description_words = {"python", "matlab"}

        self.assertEqual(
            calculate_matched_words(resume_words, job_description_words),
            {"python"},
        )
        self.assertEqual(
            calculate_missing_words(resume_words, job_description_words),
            {"matlab"},
        )


class MatchScoreTests(unittest.TestCase):
    def test_calculates_unique_word_percentage_rounded_to_one_decimal(self) -> None:
        self.assertEqual(
            calculate_match_score({"python", "sql"}, {"python", "sql", "matlab"}),
            66.7,
        )

    def test_preserves_exact_rounded_warning_boundary_values(self) -> None:
        ten_words = {f"word{index}" for index in range(10)}
        self.assertEqual(
            calculate_match_score({"word0", "word1", "word2"}, ten_words),
            30.0,
        )
        self.assertEqual(
            calculate_match_score({"word0", "word1"}, ten_words),
            20.0,
        )

    def test_empty_job_description_returns_integer_zero(self) -> None:
        score = calculate_match_score(set(), set())
        self.assertEqual(score, 0)
        self.assertIs(type(score), int)


class MissingKeywordRankingTests(unittest.TestCase):
    def test_truncates_before_ranking_and_can_exclude_most_frequent_word(self) -> None:
        early_words = [f"word{index}" for index in range(51)]
        text = " ".join(early_words + (["common"] * 100))

        result = rank_missing_keywords(text, extract_keywords(text), "")

        self.assertEqual(result.counts["common"], 100)
        self.assertEqual(len(result.displayed), 50)
        self.assertNotIn("common", result.displayed)
        self.assertIn("common", result.filtered)

    def test_ranks_with_substring_counts_instead_of_token_counts(self) -> None:
        result = rank_missing_keywords(
            "training ai",
            {"training", "ai"},
            "",
        )

        self.assertEqual(result.counts["ai"], 1)
        self.assertEqual(result.filtered, ["training", "ai"])
        self.assertEqual(result.displayed, ["ai", "training"])

    def test_filter_uses_substring_matching_and_preserves_first_occurrence(self) -> None:
        result = rank_missing_keywords(
            "training ai detail",
            {"training", "ai", "detail"},
            "ai",
        )

        self.assertEqual(result.filtered, ["training", "ai", "detail"])
        self.assertEqual(result.displayed, ["ai", "training", "detail"])

    def test_equal_counts_keep_job_description_first_occurrence_order(self) -> None:
        result = rank_missing_keywords("beta alpha", {"alpha", "beta"}, "")

        self.assertEqual(result.displayed, ["beta", "alpha"])


if __name__ == "__main__":
    unittest.main()
