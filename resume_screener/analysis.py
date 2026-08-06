"""Pure keyword-analysis functions preserving the baseline algorithms."""

from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass
from typing import Iterable


TOKEN_PATTERN = re.compile(
    r"(?<!\w)(?:c\+\+|c#|\.net|node\.js|\w+(?:-\w+)+|\w+)(?!\w)"
)


@dataclass(slots=True)
class MissingKeywordRanking:
    """Current missing-keyword counts, filtering, and display ordering."""

    counts: Counter[str]
    filtered: list[str]
    displayed: list[str]


def extract_keywords(text: str) -> set[str]:
    """Return unique lowercase words while preserving common technical terms."""
    words: list[str] = TOKEN_PATTERN.findall(text.lower())
    return set(words)


def aggregate_resume_words(resume_texts: Iterable[str]) -> set[str]:
    """Union keyword sets from every resume into one baseline candidate set."""
    resume_words: set[str] = set()
    for text in resume_texts:
        resume_words.update(extract_keywords(text))
    return resume_words


def calculate_matched_words(
    resume_words: set[str], job_description_words: set[str]
) -> set[str]:
    """Return words present in both baseline sets."""
    return resume_words.intersection(job_description_words)


def calculate_missing_words(
    resume_words: set[str], job_description_words: set[str]
) -> set[str]:
    """Return job-description words absent from the resume set."""
    return job_description_words - resume_words


def calculate_match_score(
    matched_words: set[str], job_description_words: set[str]
) -> float | int:
    """Calculate the baseline one-decimal unique-word coverage percentage."""
    return (
        round(len(matched_words) / len(job_description_words) * 100, 1)
        if job_description_words
        else 0
    )


def rank_missing_keywords(
    job_description_text: str,
    missing_words: set[str],
    keyword_filter: str,
) -> MissingKeywordRanking:
    """Rank missing ATS-aware tokens by exact frequency and first appearance."""
    tokens = TOKEN_PATTERN.findall(job_description_text.lower())
    counts = Counter(tokens)
    missing_in_first_occurrence_order = [
        word for word in counts if word in missing_words
    ]
    filtered = (
        [
            word
            for word in missing_in_first_occurrence_order
            if keyword_filter.lower() in word.lower()
        ]
        if keyword_filter
        else missing_in_first_occurrence_order
    )
    ranked = sorted(filtered, key=lambda word: -counts[word])
    return MissingKeywordRanking(
        counts=counts,
        filtered=ranked,
        displayed=ranked[:50],
    )
