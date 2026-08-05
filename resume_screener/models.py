"""Typed internal data structures used by the Streamlit application."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class ExtractedDocument:
    """Text extracted from an uploaded file or supplied manually."""

    text: str
    source_name: str | None = None
    media_type: str | None = None


@dataclass(slots=True)
class AnalysisResult:
    """The current keyword-analysis outputs without changing their semantics."""

    resume_words: set[str]
    job_description_words: set[str]
    matched: set[str]
    missing: set[str]
    match_score: float | int
