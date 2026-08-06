"""Regression coverage for the production module import contract."""

from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path

from resume_screener.analysis import MissingKeywordRanking
from resume_screener.models import (
    AnalysisResult,
    CategoryCoverage,
    ExtractedDocument,
    NormalizedConcept,
    NormalizedMatchExplanation,
    SkillsFocusedResult,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]


class ProductionImportContractTests(unittest.TestCase):
    def test_public_models_and_dependents_import_without_slots_requirement(self) -> None:
        dataclasses = (
            MissingKeywordRanking,
            ExtractedDocument,
            AnalysisResult,
            NormalizedConcept,
            NormalizedMatchExplanation,
            CategoryCoverage,
            SkillsFocusedResult,
        )
        for model in dataclasses:
            self.assertNotIn("__slots__", model.__dict__)

        import_script = """
from resume_screener.models import (
    AnalysisMode,
    AnalysisResult,
    ConceptCategory,
    ExtractedDocument,
)
import resume_screener.normalization.matcher
import resume_screener.reporting
import resume_screener.scoring.categories
import resume_screener.skills.matcher
import resume_screener.ui
import app
"""
        result = subprocess.run(
            [sys.executable, "-c", import_script],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
