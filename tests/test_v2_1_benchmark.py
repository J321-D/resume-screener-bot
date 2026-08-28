"""Evidence-driven V2.1 regression benchmarks from real-world user testing."""

from __future__ import annotations

import unittest

from resume_screener.analysis import calculate_match_score, calculate_matched_words, extract_keywords
from resume_screener.models import ConceptCategory
from resume_screener.skills.matcher import analyze_skills_focused


MERCK_BPRD_JOB_DESCRIPTION = """
Biologics Process Research & Development, Associate Scientist

Contribute to the development of innovative technologies for next-generation
biologic manufacturing processes. Develop and characterize robust clinical
processes. Independently design and conduct experiments for individual unit
operations. Integrate unit operations with relevant process control and
monitoring platforms. Collaborate across process analytics and manufacturing.
Conduct laboratory-scale and pilot-scale studies to support scale-up and tech
transfer of processes.

Required and preferred skills include bioprocesses, centrifugation,
chromatographic techniques, cross-functional teamwork, data analysis,
downstream process development, experimentation, membrane filtration systems,
process scale up, protein biochemistry, protein purifications, technology
transfer, recombinant protein production, aseptic technique, protein expression,
mammalian cell culture, design of experiments, and multivariate data analysis.
"""

R_AND_D_RESUME = """
Biomedical Engineering student with research experience in bioreactor workflows,
experimental analysis, and process development. Scaled microbial cultures for
bioreactor inoculation and upstream optimization. Operated bioreactors and used
TLC, Bradford assays, chemical analysis, and data tools for downstream
validation. Supported upstream cell culture development, scale-up validation,
troubleshooting, and prototyping. Skills include mammalian cell culture, Python,
MATLAB, experimental design, and data interpretation.
"""


class V21BenchmarkTests(unittest.TestCase):
    def test_raw_full_lexical_invariant_remains_unchanged(self) -> None:
        resume_words = extract_keywords("Python SQL")
        job_words = extract_keywords("Python SQL MATLAB")
        matched = calculate_matched_words(resume_words, job_words)

        self.assertEqual(calculate_match_score(matched, job_words), 66.7)

    def test_merck_style_job_yields_broad_curated_concept_set(self) -> None:
        result = analyze_skills_focused([R_AND_D_RESUME], MERCK_BPRD_JOB_DESCRIPTION)
        categorized_job_concepts = [
            item
            for item in result.job_concepts
            if item.category is not ConceptCategory.UNCATEGORIZED
        ]
        names = {item.concept for item in categorized_job_concepts}

        self.assertGreater(len(names), 4)
        self.assertTrue(
            {
                "bioprocessing",
                "centrifugation",
                "chromatography",
                "cross-functional collaboration",
                "data analysis",
                "downstream process development",
                "experimentation",
                "mammalian cell culture",
                "membrane filtration",
                "process scale-up",
                "protein biochemistry",
                "protein purification",
                "technology transfer",
            }.issubset(names)
        )

    def test_merck_benchmark_preserves_anti_inference_boundaries(self) -> None:
        result = analyze_skills_focused([R_AND_D_RESUME], MERCK_BPRD_JOB_DESCRIPTION)
        matched = {item.concept for item in result.matched}

        self.assertNotIn("protein purification", matched)
        self.assertNotIn("technology transfer", matched)
        self.assertNotIn("design of experiments", matched)
        self.assertNotIn("protein expression", matched)


if __name__ == "__main__":
    unittest.main()
