"""Characterization tests for the Milestone 1 Streamlit baseline.

These assertions intentionally describe current behavior, including known defects.
They are not endorsements of the scoring or ranking algorithms.
"""

from __future__ import annotations

import json
import os
import unittest
from pathlib import Path


os.environ.setdefault("MPLCONFIGDIR", "/private/tmp/resume-screener-matplotlib-tests")

from streamlit.testing.v1 import AppTest  # noqa: E402


APP_PATH = Path(__file__).resolve().parents[1] / "app.py"


class ResumeScreenerCharacterizationTests(unittest.TestCase):
    """Lock the observable baseline before production code is reorganized."""

    def run_app(self, resume: str = "", job_description: str = "") -> AppTest:
        app = AppTest.from_file(str(APP_PATH)).run(timeout=30)
        if resume:
            app.text_area[0].input(resume)
        if job_description:
            app.text_area[1].input(job_description)
        if resume or job_description:
            app.run(timeout=30)
        return app

    @staticmethod
    def score_markdown(app: AppTest) -> list[str]:
        return [
            element.value
            for element in app.markdown
            if "Resume Match Score" in element.value
        ]

    def test_initial_ui_has_the_current_controls_and_no_results(self) -> None:
        app = self.run_app()

        self.assertEqual(
            [title.value for title in app.title],
            ["📄 AI Resume Screener Bot", "⚙️ Settings"],
        )
        self.assertEqual(
            [area.label for area in app.text_area],
            ["Paste your resume here:", "Paste the job description here:"],
        )
        self.assertEqual(
            [checkbox.label for checkbox in app.checkbox],
            [
                "Enable GPT Suggestions (coming soon)",
                "Enable Keyword Highlighting",
                "Enable Side-by-Side View",
            ],
        )
        self.assertEqual(self.score_markdown(app), [])
        self.assertEqual([exception.value for exception in app.exception], [])

    def test_manual_text_produces_the_documented_score_and_keyword_lists(self) -> None:
        app = self.run_app("Python SQL", "Python SQL MATLAB")

        self.assertEqual(self.score_markdown(app), ["**✅ Resume Match Score:** 66.7%"])
        self.assertEqual(json.loads(app.json[0].value), ["python", "sql"])
        self.assertEqual(json.loads(app.json[1].value), ["matlab"])
        self.assertEqual([exception.value for exception in app.exception], [])

    def test_tokenization_preserves_the_current_technical_term_collapse(self) -> None:
        app = self.run_app("C++", "C++ C# .NET")

        self.assertEqual(self.score_markdown(app), ["**✅ Resume Match Score:** 50.0%"])
        self.assertEqual(json.loads(app.json[0].value), ["c"])
        self.assertEqual(json.loads(app.json[1].value), ["net"])

    def test_low_score_warning_uses_strictly_less_than_thirty_percent(self) -> None:
        app = self.run_app("one", "one two three four")
        self.assertEqual(self.score_markdown(app), ["**✅ Resume Match Score:** 25.0%"])
        self.assertEqual(len(app.warning), 1)

        app.text_area[0].input("one two three")
        app.text_area[1].input("one two three four five six seven eight nine ten")
        app.run(timeout=30)
        self.assertEqual(self.score_markdown(app), ["**✅ Resume Match Score:** 30.0%"])
        self.assertEqual(len(app.warning), 0)

    def test_missing_keyword_display_truncates_before_frequency_ranking(self) -> None:
        early_words = [f"word{index}" for index in range(51)]
        job_description = " ".join(early_words + (["common"] * 100))
        app = self.run_app("present", job_description)

        displayed_missing = json.loads(app.json[1].value)
        self.assertEqual(len(displayed_missing), 50)
        self.assertNotIn("common", displayed_missing)

    def test_pdf_download_renders_without_an_application_exception(self) -> None:
        app = self.run_app("Python", "Python SQL")
        app.button[0].click()
        app.run(timeout=30)

        self.assertEqual([exception.value for exception in app.exception], [])
        download_buttons = app.get("download_button")
        self.assertEqual(download_buttons[0].label, "📥 Click here to download PDF")


if __name__ == "__main__":
    unittest.main()
