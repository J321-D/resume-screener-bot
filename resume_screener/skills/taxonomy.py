"""Curated deterministic taxonomy for Skills-focused category coverage.

Unknown concepts intentionally fall back to ``Uncategorized``. This taxonomy is
not a universal skills ontology and does not infer categories from spelling,
proximity, or related experience.
"""

from resume_screener.models import ConceptCategory

TECHNICAL_SKILLS = frozenset(
    {
        "analytical technologies",
        "aseptic processing",
        "aseptic technique",
        "bioprocessing",
        "bioreactor",
        "cell culture",
        "centrifugation",
        "chromatography",
        "data analysis",
        "design of experiments",
        "downstream process development",
        "experimentation",
        "machine learning",
        "mammalian cell culture",
        "membrane filtration",
        "microbial culture",
        "multivariate analysis",
        "process development",
        "process scale-up",
        "protein biochemistry",
        "protein expression",
        "protein purification",
        "real time",
        "recombinant protein",
        "statistical analysis",
        "technology transfer",
        "upstream process development",
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
        "bachelor degree",
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
        "continuous improvement",
        "cross-functional collaboration",
        "cross-functional communication",
        "developed",
        "implemented",
        "led",
        "managed",
        "technical writing",
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
