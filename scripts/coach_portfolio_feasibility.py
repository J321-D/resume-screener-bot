"""Synthetic-only feasibility proof for a coach's multi-client lexical review.

Never accepts or persists personal documents. This is an offline research probe,
not a batch API, employment assessment, checkout, or marketed feature.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from resume_screener.analysis import (  # noqa: E402
    calculate_match_score,
    calculate_matched_words,
    calculate_missing_words,
    extract_keywords,
    rank_missing_keywords,
)

# Fabricated texts and opaque case IDs: no people, uploads, contact details,
# application records, or persisted user document data are involved.
SYNTHETIC_ROLE = "Python SQL Excel dashboards data analysis statistics communication Tableau"
SYNTHETIC_CASES = (
    ("DEMO_A", "Python SQL Excel data analysis communication"),
    ("DEMO_B", "Python statistics dashboards"),
    ("DEMO_C", "Excel Tableau communication"),
)


def run_synthetic_demo() -> dict:
    """Reuse the unchanged deterministic engine independently for each case."""
    role_words = extract_keywords(SYNTHETIC_ROLE)
    cases: list[dict] = []
    for case_id, resume_text in SYNTHETIC_CASES:
        resume_words = extract_keywords(resume_text)
        matched = calculate_matched_words(resume_words, role_words)
        missing = calculate_missing_words(resume_words, role_words)
        ranked = rank_missing_keywords(SYNTHETIC_ROLE, missing, "")
        cases.append({
            "case_id": case_id,
            "lexical_coverage_percent": calculate_match_score(matched, role_words),
            "matched_unique_terms": len(matched),
            "job_unique_terms": len(role_words),
            "missing_terms_in_engine_order": ranked.filtered,
        })
    return {
        "schema": "PJ_SYNTHETIC_COACH_PORTFOLIO_FEASIBILITY_V1",
        "provenance": "FABRICATED_INPUTS_ONLY",
        "engine": "resume_screener.analysis (unchanged)",
        "analysis_mode": "FULL_LEXICAL",
        "case_count": len(cases),
        "cases": cases,
        "score_interpretation": "Lexical term coverage only; never ATS prediction or person ranking",
        "privacy": "No actual clients, resumes, identifiers, documents or uploads are used",
        "commercial_state": "HYPOTHESIS_ONLY_ZERO_REVENUE",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Optional synthetic receipt JSON path")
    args = parser.parse_args()
    payload = json.dumps(run_synthetic_demo(), indent=2, sort_keys=True) + "\n"
    if args.output is not None:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(payload, encoding="utf-8")
        print(f"Synthetic research receipt written: {args.output}")
    else:
        print(payload, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
