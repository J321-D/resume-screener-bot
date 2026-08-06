"""Characterization tests for the Streamlit application workflow.

These assertions intentionally describe current behavior, including known defects.
They are not endorsements of the scoring or ranking algorithms.
"""

from __future__ import annotations

import json
import os
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch


os.environ.setdefault("MPLCONFIGDIR", "/private/tmp/resume-screener-matplotlib-tests")

from streamlit.testing.v1 import AppTest  # noqa: E402

from resume_screener.parsing import PDF_MEDIA_TYPE  # noqa: E402
from resume_screener.models import AnalysisMode  # noqa: E402


APP_PATH = Path(__file__).resolve().parents[1] / "app.py"


class UploadedBytes(BytesIO):
    """In-memory upload used to exercise the application parsing boundary."""

    def __init__(self, content: bytes, *, name: str, media_type: str) -> None:
        super().__init__(content)
        self.name = name
        self.type = media_type
        self.size = len(content)


class ResumeScreenerCharacterizationTests(unittest.TestCase):
    """Lock the observable baseline before production code is reorganized."""

    def run_app(
        self,
        resume: str = "",
        job_description: str = "",
        *,
        mode: AnalysisMode | None = AnalysisMode.FULL_LEXICAL,
    ) -> AppTest:
        app = AppTest.from_file(str(APP_PATH)).run(timeout=30)
        if mode is not None:
            app.radio[0].set_value(mode.value)
        if resume:
            app.text_area[0].input(resume)
        if job_description:
            app.text_area[1].input(job_description)
        if resume or job_description or mode is not None:
            app.run(timeout=30)
        return app

    @staticmethod
    def metric_values(app: AppTest) -> dict[str, str]:
        return {element.label: element.value for element in app.metric}

    @staticmethod
    def markdown_text(app: AppTest) -> str:
        return "\n".join(element.value for element in app.markdown)

    def test_initial_ui_has_the_current_controls_and_no_results(self) -> None:
        app = self.run_app(mode=None)

        visible_markdown = self.markdown_text(app)
        self.assertIn("Resume Keyword Screener", visible_markdown)
        self.assertIn(
            "Compare résumé language with a job description",
            visible_markdown,
        )
        self.assertIn(
            "Lexical keyword comparison—not a candidate-performance assessment.",
            visible_markdown,
        )
        self.assertEqual(
            [area.label for area in app.text_area],
            ["Paste your resume here:", "Paste the job description here:"],
        )
        self.assertEqual([checkbox.label for checkbox in app.checkbox], [])
        self.assertEqual(app.radio[0].value, AnalysisMode.SKILLS_FOCUSED.value)
        self.assertEqual(self.metric_values(app), {})
        self.assertEqual([exception.value for exception in app.exception], [])

    def test_manual_text_produces_the_documented_score_and_keyword_lists(self) -> None:
        app = self.run_app("Python SQL", "Python SQL MATLAB")

        self.assertEqual(
            self.metric_values(app),
            {
                "Keyword coverage": "66.7%",
                "Matched": "2",
                "Missing": "1",
                "Unique JD tokens": "3",
            },
        )
        self.assertEqual(json.loads(app.json[0].value), ["python", "sql"])
        self.assertEqual(json.loads(app.json[1].value), ["matlab"])
        self.assertEqual(
            [expander.label for expander in app.expander],
            ["Résumé preview", "Job description preview"],
        )
        self.assertEqual([exception.value for exception in app.exception], [])

    def test_tokenization_preserves_ats_technical_terms(self) -> None:
        app = self.run_app("C++", "C++ C# .NET")

        self.assertEqual(
            self.metric_values(app),
            {
                "Keyword coverage": "33.3%",
                "Matched": "1",
                "Missing": "2",
                "Unique JD tokens": "3",
            },
        )
        self.assertEqual(json.loads(app.json[0].value), ["c++"])
        self.assertEqual(json.loads(app.json[1].value), ["c#", ".net"])

    def test_skills_focused_mode_filters_filler_and_explains_synonyms(self) -> None:
        app = self.run_app(
            "QC C++ cell-culture",
            "We are seeking quality control and C++ with cell culture Python",
            mode=AnalysisMode.SKILLS_FOCUSED,
        )

        metrics = self.metric_values(app)
        self.assertEqual(metrics["Overall coverage"], "60.0%")
        self.assertEqual(metrics["Quality/regulatory"], "100.0%")
        self.assertEqual(metrics["Tools/software"], "50.0%")
        self.assertEqual(metrics["Technical skills"], "100.0%")
        self.assertEqual(metrics["Education"], "N/A — no applicable concepts")
        self.assertEqual(
            json.loads(app.json[0].value),
            ["quality control", "C++", "cell culture"],
        )
        self.assertIn("Python", json.loads(app.json[1].value))
        self.assertIn(
            "Normalized match explanations",
            [expander.label for expander in app.expander],
        )
        self.assertEqual([exception.value for exception in app.exception], [])

    def test_low_score_warning_uses_strictly_less_than_thirty_percent(self) -> None:
        app = self.run_app("one", "one two three four")
        self.assertEqual(self.metric_values(app)["Keyword coverage"], "25.0%")
        self.assertEqual(len(app.warning), 1)

        app.text_area[0].input("one two three")
        app.text_area[1].input("one two three four five six seven eight nine ten")
        app.run(timeout=30)
        self.assertEqual(self.metric_values(app)["Keyword coverage"], "30.0%")
        self.assertEqual(len(app.warning), 0)

    def test_missing_keyword_display_ranks_before_limit(self) -> None:
        early_words = [f"word{index}" for index in range(51)]
        job_description = " ".join(early_words + (["common"] * 100))
        app = self.run_app("present", job_description)

        displayed_missing = json.loads(app.json[1].value)
        self.assertEqual(len(displayed_missing), 50)
        self.assertEqual(displayed_missing[0], "common")

    def test_unfinished_placeholder_sections_are_hidden(self) -> None:
        app = self.run_app("Python SQL", "Python SQL MATLAB")
        visible_markdown = self.markdown_text(app)

        hidden_copy = [
            "GPT Suggestions",
            "Keyword Highlighting",
            "Resume Templates",
            "Peer Reviews",
            "Virtual Career Coach",
            "Interview Preparation",
            "Personalized Career Path",
            "Industry-Specific Resume Optimizer",
            "Skill Development Plan",
            "Smart Suggestions",
        ]
        for text in hidden_copy:
            self.assertNotIn(text, visible_markdown)

        self.assertEqual([selectbox.label for selectbox in app.selectbox], [])
        self.assertNotIn(
            "Submit your resume for peer review:",
            [area.label for area in app.text_area],
        )
        self.assertNotIn(
            "Enable GPT Suggestions (coming soon)",
            [checkbox.label for checkbox in app.checkbox],
        )
        self.assertNotIn(
            "Enable Keyword Highlighting",
            [checkbox.label for checkbox in app.checkbox],
        )

    def test_pdf_download_renders_without_an_application_exception(self) -> None:
        app = self.run_app("Python", "Python SQL")
        app.button[0].click()
        app.run(timeout=30)

        self.assertEqual([exception.value for exception in app.exception], [])
        download_buttons = app.get("download_button")
        self.assertEqual(download_buttons[0].label, "📥 Click here to download PDF")

    def test_upload_parsing_error_is_friendly_and_does_not_crash(self) -> None:
        broken_pdf = UploadedBytes(
            b"not a pdf",
            name="broken.pdf",
            media_type=PDF_MEDIA_TYPE,
        )

        with patch(
            "resume_screener.ui.render_input_panels",
            return_value=([broken_pdf], None, "", ""),
        ):
            app = AppTest.from_file(str(APP_PATH)).run(timeout=30)

        self.assertEqual(
            [error.value for error in app.error],
            ["broken.pdf is not a valid PDF or is corrupted."],
        )
        self.assertEqual([exception.value for exception in app.exception], [])
        self.assertEqual(self.metric_values(app), {})


if __name__ == "__main__":
    unittest.main()
