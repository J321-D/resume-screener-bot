"""Focused tests for responsive styling and native theme defaults."""

from __future__ import annotations

import unittest
from pathlib import Path

from resume_screener.styles import APP_CSS


PROJECT_ROOT = Path(__file__).resolve().parents[1]


class ResponsiveStyleTests(unittest.TestCase):
    def test_defines_semantic_tokens_that_inherit_streamlit_theme(self) -> None:
        for token in (
            "--rks-surface",
            "--rks-border",
            "--rks-text-primary",
            "--rks-text-secondary",
            "--rks-accent",
            "--rks-matched",
            "--rks-missing",
            "--rks-warning",
        ):
            self.assertIn(token, APP_CSS)
        self.assertIn("currentColor", APP_CSS)
        self.assertIn("color-mix(in srgb, currentColor", APP_CSS)
        self.assertNotIn("prefers-color-scheme", APP_CSS)

    def test_defines_narrow_width_stacking_rules(self) -> None:
        self.assertIn("@media (max-width: 760px)", APP_CSS)
        self.assertIn('[data-testid="stHorizontalBlock"]', APP_CSS)
        self.assertIn("flex-direction: column", APP_CSS)
        self.assertIn("overflow-wrap: anywhere", APP_CSS)
        self.assertIn("max-width: 100%", APP_CSS)
        self.assertNotIn(".css-", APP_CSS)

    def test_streamlit_config_defines_native_theme_defaults(self) -> None:
        config_path = PROJECT_ROOT / ".streamlit" / "config.toml"
        config = config_path.read_text(encoding="utf-8")

        self.assertIn('[theme]', config)
        self.assertIn('base = "light"', config)
        self.assertIn('primaryColor = "#315EFB"', config)
        self.assertIn('font = "sans serif"', config)
        self.assertIn('[server]', config)
        self.assertIn('maxUploadSize = 10', config)


if __name__ == "__main__":
    unittest.main()
