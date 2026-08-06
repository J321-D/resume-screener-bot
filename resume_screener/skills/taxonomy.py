"""Narrow, documented taxonomy for Milestone 1 category coverage.

Unknown concepts intentionally fall back to ``Uncategorized``. This taxonomy is
not a universal skills ontology and does not infer categories from spelling.
"""

from resume_screener.models import ConceptCategory

TECHNICAL_SKILLS = frozenset(
    {
        "aseptic processing",
        "bioreactor",
        "cell culture",
        "chromatography",
        "design of experiments",
        "machine learning",
        "process development",
        "real time",
        "statistical analysis",
    }
)

QUALITY_REGULATORY = frozenset(
    {
        "capa",
        "change control",
        "corrective and preventive action",
        "deviation investigation",
        "equipment qualification",
        "good manufacturing practice",
        "quality assurance",
        "quality control",
        "process validation",
        "process validation protocol",
        "risk assessment",
        "root cause",
        "root cause analysis",
        "standard operating procedure",
    }
)

TOOLS_SOFTWARE = frozenset(
    {
        ".net",
        "c#",
        "c++",
        "electronic batch record",
        "matlab",
        "node.js",
        "python",
        "r",
        "sql",
    }
)

EDUCATION = frozenset(
    {
        "bachelor",
        "bachelor's",
        "degree",
        "doctorate",
        "master",
        "master's",
        "phd",
    }
)

EXPERIENCE_ACTION = frozenset(
    {
        "collaborated",
        "communication",
        "cross-functional communication",
        "developed",
        "implemented",
        "led",
        "managed",
        "technical writing",
        "continuous improvement",
        "validated",
    }
)

_CATEGORY_TERMS = (
    (ConceptCategory.TECHNICAL_SKILLS, TECHNICAL_SKILLS),
    (ConceptCategory.QUALITY_REGULATORY, QUALITY_REGULATORY),
    (ConceptCategory.TOOLS_SOFTWARE, TOOLS_SOFTWARE),
    (ConceptCategory.EDUCATION, EDUCATION),
    (ConceptCategory.EXPERIENCE_ACTION, EXPERIENCE_ACTION),
)


def classify_concept(concept: str) -> ConceptCategory:
    """Return the explicit category for a concept or the fallback category."""
    for category, terms in _CATEGORY_TERMS:
        if concept in terms:
            return category
    return ConceptCategory.UNCATEGORIZED
