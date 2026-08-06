"""Typed internal data structures used by the Streamlit application."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


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


class AnalysisMode(str, Enum):
    """User-selectable deterministic analysis modes."""

    SKILLS_FOCUSED = "Skills-focused analysis"
    FULL_LEXICAL = "Full lexical analysis"


class ConceptCategory(str, Enum):
    """Curated coverage categories with an explicit fallback."""

    TECHNICAL_SKILLS = "Technical skills"
    QUALITY_REGULATORY = "Quality/regulatory"
    TOOLS_SOFTWARE = "Tools/software"
    EDUCATION = "Education"
    EXPERIENCE_ACTION = "Experience/action terms"
    UNCATEGORIZED = "Uncategorized"


@dataclass(slots=True)
class NormalizedConcept:
    """A canonical concept and its first observed surface representation."""

    concept: str
    display_term: str
    category: ConceptCategory
    count: int


@dataclass(frozen=True, slots=True)
class NormalizedMatchExplanation:
    """Explain an explicit synonym or surface-form match."""

    concept: str
    resume_term: str
    job_term: str


@dataclass(frozen=True, slots=True)
class CategoryCoverage:
    """Coverage for one curated concept category."""

    category: ConceptCategory
    matched: int
    total: int
    score: float | int

    @property
    def display_value(self) -> str:
        """Format empty categories without implying a measured zero score."""
        if self.total == 0:
            return "N/A — no applicable concepts"
        return f"{self.score}%"


@dataclass(slots=True)
class SkillsFocusedResult:
    """Ordered outputs from deterministic relevance-focused analysis."""

    resume_concepts: list[NormalizedConcept]
    job_concepts: list[NormalizedConcept]
    matched: list[NormalizedConcept]
    missing: list[NormalizedConcept]
    explanations: list[NormalizedMatchExplanation]
    category_coverage: dict[ConceptCategory, CategoryCoverage]
    overall_score: float | int
