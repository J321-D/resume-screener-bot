"""Narrow, curated aliases for explicitly supported résumé concepts.

No stemming, fuzzy matching, or inferred equivalence is performed. Additions to
this mapping require a focused regression test and documented intent.
"""

SYNONYM_MAP: dict[str, str] = {
    "qa": "quality assurance",
    "qc": "quality control",
    "gmp": "good manufacturing practice",
    "doe": "design of experiments",
    "capa": "corrective and preventive action",
    "sop": "standard operating procedure",
    "ebr": "electronic batch record",
    "bioreactors": "bioreactor",
    "résumé": "resume",
    "validation protocol": "process validation protocol",
    "process-validation": "process validation",
    "root-cause": "root cause",
    "root-cause-analysis": "root cause analysis",
    "design-of-experiments": "design of experiments",
    "quality-control": "quality control",
    "quality-assurance": "quality assurance",
    "cell-culture": "cell culture",
    "machine-learning": "machine learning",
    "real-time": "real time",
}
