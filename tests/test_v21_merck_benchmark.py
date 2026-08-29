"""Frozen V2.1 acceptance benchmark for the manually verified Merck-style fixture."""

from __future__ import annotations

import unittest

from resume_screener.models import ConceptCategory
from resume_screener.skills.matcher import analyze_skills_focused


RESUME = """
SUMMARY
Biomedical Engineering student with research experience in bioreactor workflows, experimental analysis, scientific software development, and technical communication. Targeting Research Associate, R&D Technician, Associate Scientist, and process development roles.

EDUCATION
Stony Brook University
Bachelor of Engineering, Biomedical Engineering
Expected: May 2027
Biomedical Engineering Society | Theta Tau

RESEARCH & TECHNICAL EXPERIENCE
Allied Microbiota
Senior Research Aide
Sep. 2024 – Jun. 2025
Scaled microbial cultures 5-10× for bioreactor inoculation, upstream optimization, and environmental biotech applications.
Operated 1-5 L bioreactors and supported bioaugmentation workflows for pollutant degradation research.
Used TLC, Bradford assays, chemical analysis, and data tools for downstream validation.

Sartorius Stedim Biotech
Upstream R&D and Prototyping Co-op
Oct. 2022 – Aug. 2023
Designed and validated a bioreactor power-input testing system, improving measurement accuracy by approximately 20%.
Benchmarked 5+ AMBR 250 vessel variants across 500+ test conditions to support product development decisions.
Supported upstream cell culture development, scale-up validation, troubleshooting, and prototyping.

SKILLS & CERTIFICATIONS
Research & R&D: bioreactor workflows, microbial culture, experimental design, chemical analysis, TLC, Bradford assays, data interpretation
Bioprocessing: AMBR 250, Cedex BioHT/HiRes, BIOSTAT STR/D-DCU, MFCS, mammalian cell culture
Engineering/Software: Python, Streamlit, Git, GitHub, Plotly, SolidWorks, MATLAB, AutoCAD, Fusion 360, LabVIEW
"""


JOB_DESCRIPTION = """
Biologics Process Research & Development, Associate Scientist

Develop and characterize innovative, robust biologics manufacturing processes and next-generation biomanufacturing technologies.
Design and conduct experiments for individual unit operations using relevant operational parameters and analytical inputs.
Integrate unit operations with process control and monitoring platforms.
Collaborate across process development, process analytics, R&D, and manufacturing teams.
Conduct laboratory-scale and pilot-scale studies supporting process scale-up and technology transfer.
Maintain a safe and compliant laboratory environment.

EDUCATION
BS degree or expected completion by June 2027 in Chemical Engineering, Biochemical Engineering, Biomedical Engineering, Biotechnology, Biochemistry, Microbiology, Structural Biology, or a related field.

REQUIRED EXPERIENCE AND SKILLS
Engineering principles for recombinant protein production unit operations.
Aseptic technique.
Protein biophysical properties.
General protein laboratory practices.
Biologics process development.

PREFERRED EXPERIENCE AND SKILLS
Molecular biology.
Protein expression.
Mammalian cell culture.
Protein purification.
Biochemical engineering.
Protein analytical technologies.
Design of experiments.
Multivariate data analysis.

REQUIRED SKILLS
Bioprocesses
Business Process Documentation
Centrifugation
Chromatographic Techniques
Cross-Functional Teamwork
Data Analysis
Downstream Process Development
Evaluating New Technologies
Experimentation
Innovation
Membrane Filtration Systems
Process Scale Up
Protein Biochemistry
Protein Purifications
Technology Transfer
"""


class V21MerckBenchmarkTests(unittest.TestCase):
    def test_frozen_merck_fixture_keeps_verified_primary_coverage(self) -> None:
        result = analyze_skills_focused([RESUME], JOB_DESCRIPTION)

        self.assertEqual(result.primary_coverage.matched, 4)
        self.assertEqual(result.primary_coverage.total, 20)
        self.assertEqual(result.primary_coverage.score, 20.0)

        matched = {
            item.concept
            for item in result.matched
            if item.category is not ConceptCategory.UNCATEGORIZED
        }
        self.assertEqual(
            matched,
            {
                "bachelor degree",
                "mammalian cell culture",
                "process scale-up",
                "bioprocessing",
            },
        )

    def test_frozen_merck_fixture_preserves_protected_no_inference_boundaries(self) -> None:
        result = analyze_skills_focused([RESUME], JOB_DESCRIPTION)
        missing = {item.concept for item in result.missing}

        # These phrases are intentionally not inferred from nearby but non-equivalent résumé language.
        self.assertIn("technology transfer", missing)  # scale-up != technology transfer
        self.assertIn("protein purification", missing)  # Bradford/TLC != protein purification
        self.assertIn("design of experiments", missing)  # experimental design != DOE
        self.assertIn("protein expression", missing)  # cell culture != protein expression
        self.assertIn("chromatography", missing)  # TLC != broad chromatography claim
        self.assertIn("data analysis", missing)  # data interpretation != data analysis

    def test_uncategorized_language_never_enters_primary_denominator(self) -> None:
        result = analyze_skills_focused([RESUME], JOB_DESCRIPTION)
        uncategorized = result.category_coverage[ConceptCategory.UNCATEGORIZED]
        categorized_total = sum(
            coverage.total
            for category, coverage in result.category_coverage.items()
            if category is not ConceptCategory.UNCATEGORIZED
        )

        self.assertGreater(uncategorized.total, 0)
        self.assertEqual(categorized_total, result.primary_coverage.total)
        self.assertEqual(result.primary_coverage.total, 20)


if __name__ == "__main__":
    unittest.main()
