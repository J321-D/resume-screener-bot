"""Curated stop words used only by skills-focused analysis.

The list is intentionally small and explicit. Full lexical analysis does not use
it, and technical abbreviations are not inferred or removed.
"""

ENGLISH_STOP_WORDS = frozenset(
    {
        "a",
        "an",
        "and",
        "are",
        "as",
        "at",
        "be",
        "by",
        "for",
        "from",
        "in",
        "is",
        "it",
        "of",
        "on",
        "or",
        "our",
        "that",
        "the",
        "this",
        "to",
        "we",
        "with",
        "you",
        "your",
    }
)
