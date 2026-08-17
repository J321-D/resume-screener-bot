"""Conservative semantic-section detection tests."""

from __future__ import annotations

import unittest

from resume_screener.models import DocumentHeadingHint, ExtractedDocument
from resume_screener.sections import detect_sections, section_for_span


class DetectSectionsTests(unittest.TestCase):
    def test_detects_standalone_known_headings_with_exact_ranges(self) -> None:
        text = "SUMMARY\nEngineer\n\nEXPERIENCE\nBuilt systems\n\nSKILLS\nPython SQL"
        sections = detect_sections(ExtractedDocument(text=text), "resume_1")

        self.assertEqual(
            [item.normalized_type for item in sections],
            ["summary", "experience", "skills"],
        )
        self.assertEqual([item.raw_heading for item in sections], ["SUMMARY", "EXPERIENCE", "SKILLS"])
        self.assertEqual("".join(text[item.start : item.end] for item in sections), text)
        self.assertEqual(sections[0].detection_method, "standalone_known_heading")

    def test_supports_repeated_headings_with_distinct_stable_ids(self) -> None:
        text = "EXPERIENCE\nA\n\nEXPERIENCE\nB"
        first = detect_sections(ExtractedDocument(text=text), "resume_1")
        second = detect_sections(ExtractedDocument(text=text), "resume_1")

        self.assertEqual(first, second)
        self.assertEqual(len(first), 2)
        self.assertNotEqual(first[0].section_id, first[1].section_id)

    def test_rejects_heading_like_bullets_and_embedded_prose(self) -> None:
        text = "- Skills\nExperience with Python\nWe value education and research."
        self.assertEqual(detect_sections(ExtractedDocument(text=text), "resume_1"), [])

    def test_title_case_requires_a_structural_boundary(self) -> None:
        accepted = detect_sections(
            ExtractedDocument(text="Intro\n\nWork Experience\nPython"), "resume_1"
        )
        rejected = detect_sections(
            ExtractedDocument(text="Intro\nWork Experience\nPython"), "resume_1"
        )

        self.assertEqual([item.normalized_type for item in accepted], ["experience"])
        self.assertEqual(rejected, [])

    def test_parser_hints_must_reconstruct_exact_canonical_surface(self) -> None:
        document = ExtractedDocument(
            text="Experience\nPython",
            heading_hints=(
                DocumentHeadingHint(0, 10, "EXPERIENCE", "docx_heading_style"),
            ),
        )
        self.assertEqual(detect_sections(document, "resume_1"), [])

    def test_section_lookup_requires_complete_containment(self) -> None:
        text = "SKILLS\nPython\n\nEXPERIENCE\nSQL"
        sections = detect_sections(ExtractedDocument(text=text), "resume_1")

        self.assertEqual(section_for_span(sections, 7, 13), sections[0])
        self.assertIsNone(section_for_span(sections, 12, 22))


if __name__ == "__main__":
    unittest.main()
