"""Curated two- and three-token phrases recognized longest-first."""

PHRASE_MAP: dict[str, str] = {
    "quality assurance": "quality assurance",
    "quality control": "quality control",
    "process validation": "process validation",
    "root cause analysis": "root cause analysis",
    "root cause": "root cause",
    "design of experiments": "design of experiments",
    "good manufacturing practice": "good manufacturing practice",
    "change control": "change control",
    "risk assessment": "risk assessment",
    "equipment qualification": "equipment qualification",
    "electronic batch records": "electronic batch record",
    "electronic batch record": "electronic batch record",
    "technical writing": "technical writing",
    "statistical analysis": "statistical analysis",
    "continuous improvement": "continuous improvement",
    "cross-functional communication": "cross-functional communication",
    "standard operating procedure": "standard operating procedure",
    "standard operating procedures": "standard operating procedure",
    "validation protocol": "process validation protocol",
    "machine learning": "machine learning",
    "cell culture": "cell culture",
    "real time": "real time",
}

MAX_PHRASE_TOKENS = 3
MIN_PHRASE_TOKENS = 2
