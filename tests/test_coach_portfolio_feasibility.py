"""No client data, inflated metrics, or altered engine rules in coach probe."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from resume_screener.analysis import (
    calculate_match_score,
    calculate_matched_words,
    extract_keywords,
)
from scripts.coach_portfolio_feasibility import (
    SYNTHETIC_CASES,
    SYNTHETIC_ROLE,
    run_synthetic_demo,
)

ROOT = Path(__file__).resolve().parents[1]


class CoachPortfolioFeasibilityTests(unittest.TestCase):
    def test_each_case_is_distinct_and_matches_canonical_engine(self) -> None:
        payload = run_synthetic_demo()
        self.assertEqual(payload["schema"], "PJ_SYNTHETIC_COACH_PORTFOLIO_FEASIBILITY_V1")
        self.assertEqual(payload["case_count"], 3)
        self.assertEqual(payload["provenance"], "FABRICATED_INPUTS_ONLY")
        role = extract_keywords(SYNTHETIC_ROLE)
        for row, (case_id, resume_text) in zip(payload["cases"], SYNTHETIC_CASES):
            expected = calculate_match_score(
                calculate_matched_words(extract_keywords(resume_text), role), role
            )
            self.assertEqual(row["case_id"], case_id)
            self.assertEqual(row["lexical_coverage_percent"], expected)
            self.assertEqual(row["job_unique_terms"], len(role))
            self.assertEqual(
                row["matched_unique_terms"] + len(row["missing_terms_in_engine_order"]),
                len(role),
            )

    def test_no_raw_documents_or_commercial_success_claims_are_exported(self) -> None:
        payload = run_synthetic_demo()
        serialized = json.dumps(payload, sort_keys=True)
        self.assertNotIn(SYNTHETIC_ROLE, serialized)
        for _, text in SYNTHETIC_CASES:
            self.assertNotIn(text, serialized)
        self.assertEqual(payload["commercial_state"], "HYPOTHESIS_ONLY_ZERO_REVENUE")
        self.assertNotIn("revenue_usd", payload)
        self.assertEqual(payload, run_synthetic_demo())

    def test_optional_file_output_is_identical_to_synthetic_return(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "receipt.json"
            completed = subprocess.run(
                [sys.executable, str(ROOT / "scripts/coach_portfolio_feasibility.py"),
                 "--output", str(output)],
                capture_output=True, text=True, timeout=20, check=False
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            self.assertEqual(json.loads(output.read_text()), run_synthetic_demo())


if __name__ == "__main__":
    unittest.main()
