"""Characterization tests for uploaded-document parsing."""

from __future__ import annotations

import unittest
from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

import fitz

from resume_screener.parsing import (
    DOCX_MEDIA_TYPE,
    MAX_UPLOAD_SIZE_BYTES,
    PDF_MEDIA_TYPE,
    DocumentParsingError,
    ParsingErrorCode,
    parse_uploaded_document,
)


class UploadedBytes(BytesIO):
    """In-memory stand-in for the Streamlit attributes used by the parser."""

    def __init__(self, content: bytes, *, name: str, media_type: str) -> None:
        super().__init__(content)
        self.name = name
        self.type = media_type
        self.size = len(content)


class OversizedUpload:
    """Upload double that proves size rejection happens before reading."""

    name = "large.pdf"
    type = PDF_MEDIA_TYPE
    size = MAX_UPLOAD_SIZE_BYTES + 1

    def read(self, size: int = -1) -> bytes:
        raise AssertionError("oversized upload should not be read")


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

    def test_extracts_valid_utf8_text(self) -> None:
        upload = UploadedBytes(
            b"Python SQL",
            name="resume.txt",
            media_type="text/plain",
        )

        result = parse_uploaded_document(upload)

        self.assertEqual(result.text, "Python SQL")

    def test_rejects_oversized_upload_before_parsing(self) -> None:
        with self.assertRaises(DocumentParsingError) as caught:
            parse_uploaded_document(OversizedUpload())

        self.assertEqual(caught.exception.code, ParsingErrorCode.FILE_TOO_LARGE)
        self.assertIn("10 MB", caught.exception.user_message)

    def test_rejects_unreadable_text(self) -> None:
        upload = UploadedBytes(
            b"Python\xff SQL",
            name="resume.txt",
            media_type="text/plain",
        )

        with self.assertRaises(DocumentParsingError) as caught:
            parse_uploaded_document(upload)

        self.assertEqual(caught.exception.code, ParsingErrorCode.UNREADABLE_TEXT)
        self.assertIsInstance(caught.exception.__cause__, UnicodeDecodeError)

    def test_rejects_unsupported_media_type(self) -> None:
        upload = UploadedBytes(
            b"fallback text",
            name="resume.bin",
            media_type="application/octet-stream",
        )

        with self.assertRaises(DocumentParsingError) as caught:
            parse_uploaded_document(upload)

        self.assertEqual(caught.exception.code, ParsingErrorCode.UNSUPPORTED_TYPE)

    def test_rejects_image_only_pdf_without_ocr(self) -> None:
        upload = UploadedBytes(
            make_pdf(),
            name="scan.pdf",
            media_type=PDF_MEDIA_TYPE,
        )

        with self.assertRaises(DocumentParsingError) as caught:
            parse_uploaded_document(upload)

        self.assertEqual(caught.exception.code, ParsingErrorCode.NO_EXTRACTABLE_TEXT)
        self.assertIn("OCR", caught.exception.user_message)

    def test_converts_malformed_pdf_exception(self) -> None:
        upload = UploadedBytes(
            b"not a pdf",
            name="broken.pdf",
            media_type=PDF_MEDIA_TYPE,
        )

        with self.assertRaises(DocumentParsingError) as caught:
            parse_uploaded_document(upload)

        self.assertEqual(caught.exception.code, ParsingErrorCode.MALFORMED_PDF)
        self.assertIsInstance(caught.exception.__cause__, fitz.FileDataError)

    def test_rejects_encrypted_pdf_with_friendly_error(self) -> None:
        upload = UploadedBytes(
            make_encrypted_pdf(),
            name="locked.pdf",
            media_type=PDF_MEDIA_TYPE,
        )

        with self.assertRaises(DocumentParsingError) as caught:
            parse_uploaded_document(upload)

        self.assertEqual(caught.exception.code, ParsingErrorCode.ENCRYPTED_PDF)
        self.assertIn("password-protected", caught.exception.user_message)

    def test_converts_malformed_docx_exception(self) -> None:
        upload = UploadedBytes(
            b"not a docx archive",
            name="broken.docx",
            media_type=DOCX_MEDIA_TYPE,
        )

        with self.assertRaises(DocumentParsingError) as caught:
            parse_uploaded_document(upload)

        self.assertEqual(caught.exception.code, ParsingErrorCode.MALFORMED_DOCX)
        self.assertIsNotNone(caught.exception.__cause__)

    def test_rejects_empty_extracted_text(self) -> None:
        upload = UploadedBytes(
            b"  \n\t",
            name="empty.txt",
            media_type="text/plain",
        )

        with self.assertRaises(DocumentParsingError) as caught:
            parse_uploaded_document(upload)

        self.assertEqual(caught.exception.code, ParsingErrorCode.EMPTY_TEXT)


if __name__ == "__main__":
    unittest.main()
