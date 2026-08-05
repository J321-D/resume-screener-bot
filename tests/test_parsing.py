"""Characterization tests for uploaded-document parsing."""

from __future__ import annotations

import unittest
from io import BytesIO
from zipfile import BadZipFile, ZIP_DEFLATED, ZipFile

import fitz

from resume_screener.parsing import (
    DOCX_MEDIA_TYPE,
    PDF_MEDIA_TYPE,
    parse_uploaded_document,
)


class UploadedBytes(BytesIO):
    """In-memory stand-in for the Streamlit attributes used by the parser."""

    def __init__(self, content: bytes, *, name: str, media_type: str) -> None:
        super().__init__(content)
        self.name = name
        self.type = media_type


def make_pdf(text: str | None = None) -> bytes:
    document = fitz.open()
    page = document.new_page()
    if text is not None:
        page.insert_text((72, 72), text)
    content = document.tobytes()
    document.close()
    return content


def make_docx(text: str) -> bytes:
    content = BytesIO()
    document_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/'
        'wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>'
        f"{text}"
        "</w:t></w:r></w:p></w:body></w:document>"
    )
    with ZipFile(content, "w", ZIP_DEFLATED) as archive:
        archive.writestr("word/document.xml", document_xml)
    return content.getvalue()


def make_encrypted_pdf() -> bytes:
    document = fitz.open()
    document.new_page()
    content = document.tobytes(
        encryption=fitz.PDF_ENCRYPT_AES_256,
        owner_pw="owner-password",
        user_pw="user-password",
    )
    document.close()
    return content


class ParseUploadedDocumentTests(unittest.TestCase):
    def test_extracts_pdf_pages_and_preserves_metadata(self) -> None:
        upload = UploadedBytes(
            make_pdf("PDF resume"),
            name="resume.pdf",
            media_type=PDF_MEDIA_TYPE,
        )

        result = parse_uploaded_document(upload)

        self.assertEqual(result.text, "PDF resume\n")
        self.assertEqual(result.source_name, "resume.pdf")
        self.assertEqual(result.media_type, PDF_MEDIA_TYPE)

    def test_extracts_docx_with_the_existing_docx2txt_parser(self) -> None:
        upload = UploadedBytes(
            make_docx("DOCX resume"),
            name="resume.docx",
            media_type=DOCX_MEDIA_TYPE,
        )

        result = parse_uploaded_document(upload)

        self.assertEqual(result.text, "DOCX resume")

    def test_decodes_text_as_utf8_and_ignores_invalid_bytes(self) -> None:
        upload = UploadedBytes(
            b"Python\xff SQL",
            name="resume.txt",
            media_type="text/plain",
        )

        result = parse_uploaded_document(upload)

        self.assertEqual(result.text, "Python SQL")

    def test_unknown_media_type_uses_the_plain_text_branch(self) -> None:
        upload = UploadedBytes(
            b"fallback text",
            name="resume.bin",
            media_type="application/octet-stream",
        )

        result = parse_uploaded_document(upload)

        self.assertEqual(result.text, "fallback text")

    def test_image_only_pdf_returns_empty_text(self) -> None:
        upload = UploadedBytes(
            make_pdf(),
            name="scan.pdf",
            media_type=PDF_MEDIA_TYPE,
        )

        result = parse_uploaded_document(upload)

        self.assertEqual(result.text, "")

    def test_malformed_pdf_preserves_fitz_exception(self) -> None:
        upload = UploadedBytes(
            b"not a pdf",
            name="broken.pdf",
            media_type=PDF_MEDIA_TYPE,
        )

        with self.assertRaises(fitz.FileDataError):
            parse_uploaded_document(upload)

    def test_encrypted_pdf_preserves_fitz_exception(self) -> None:
        upload = UploadedBytes(
            make_encrypted_pdf(),
            name="locked.pdf",
            media_type=PDF_MEDIA_TYPE,
        )

        with self.assertRaisesRegex(ValueError, "document closed or encrypted"):
            parse_uploaded_document(upload)

    def test_malformed_docx_preserves_zip_exception(self) -> None:
        upload = UploadedBytes(
            b"not a docx archive",
            name="broken.docx",
            media_type=DOCX_MEDIA_TYPE,
        )

        with self.assertRaises(BadZipFile):
            parse_uploaded_document(upload)


if __name__ == "__main__":
    unittest.main()
