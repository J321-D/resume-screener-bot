"""Shared uploaded-document parsing with typed, user-safe failures."""

from __future__ import annotations

from enum import Enum
from io import BytesIO
from typing import Protocol

import docx2txt
import fitz

from resume_screener.models import ExtractedDocument


PDF_MEDIA_TYPE = "application/pdf"
DOCX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)
TXT_MEDIA_TYPE = "text/plain"
MAX_UPLOAD_SIZE_MB = 10
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
SUPPORTED_MEDIA_TYPES = {PDF_MEDIA_TYPE, DOCX_MEDIA_TYPE, TXT_MEDIA_TYPE}


class ParsingErrorCode(str, Enum):
    """Stable categories for upload failures shown through the UI boundary."""

    FILE_TOO_LARGE = "file_too_large"
    UNSUPPORTED_TYPE = "unsupported_type"
    UNREADABLE_FILE = "unreadable_file"
    UNREADABLE_TEXT = "unreadable_text"
    MALFORMED_PDF = "malformed_pdf"
    ENCRYPTED_PDF = "encrypted_pdf"
    NO_EXTRACTABLE_TEXT = "no_extractable_text"
    MALFORMED_DOCX = "malformed_docx"
    EMPTY_TEXT = "empty_text"


class DocumentParsingError(Exception):
    """Typed parsing failure containing a concise user-facing message."""

    def __init__(
        self,
        code: ParsingErrorCode,
        user_message: str,
        *,
        source_name: str,
    ) -> None:
        super().__init__(user_message)
        self.code = code
        self.user_message = user_message
        self.source_name = source_name


class UploadedDocument(Protocol):
    """The uploaded-file attributes consumed by the parser."""

    name: str
    type: str
    size: int

    def read(self, size: int = -1) -> bytes:
        """Read uploaded bytes."""


def parse_uploaded_document(uploaded_document: UploadedDocument) -> ExtractedDocument:
    """Validate and extract text while converting parser failures."""
    source_name = uploaded_document.name
    media_type = uploaded_document.type
    reported_size = getattr(uploaded_document, "size", None)

    if isinstance(reported_size, int) and reported_size > MAX_UPLOAD_SIZE_BYTES:
        raise DocumentParsingError(
            ParsingErrorCode.FILE_TOO_LARGE,
            f"{source_name} exceeds the {MAX_UPLOAD_SIZE_MB} MB upload limit.",
            source_name=source_name,
        )

    if media_type not in SUPPORTED_MEDIA_TYPES:
        raise DocumentParsingError(
            ParsingErrorCode.UNSUPPORTED_TYPE,
            (
                f"{source_name} is not a supported file type. "
                "Upload a PDF, DOCX, or TXT file."
            ),
            source_name=source_name,
        )

    try:
        content = uploaded_document.read()
    except Exception as error:
        raise DocumentParsingError(
            ParsingErrorCode.UNREADABLE_FILE,
            f"{source_name} could not be read.",
            source_name=source_name,
        ) from error

    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise DocumentParsingError(
            ParsingErrorCode.FILE_TOO_LARGE,
            f"{source_name} exceeds the {MAX_UPLOAD_SIZE_MB} MB upload limit.",
            source_name=source_name,
        )

    if media_type == PDF_MEDIA_TYPE:
        try:
            with fitz.open(stream=content, filetype="pdf") as document:
                if document.needs_pass:
                    raise DocumentParsingError(
                        ParsingErrorCode.ENCRYPTED_PDF,
                        (
                            f"{source_name} is password-protected. "
                            "Remove the password and upload it again."
                        ),
                        source_name=source_name,
                    )
                text = "".join(page.get_text() for page in document)
        except DocumentParsingError:
            raise
        except Exception as error:
            raise DocumentParsingError(
                ParsingErrorCode.MALFORMED_PDF,
                f"{source_name} is not a valid PDF or is corrupted.",
                source_name=source_name,
            ) from error
    elif media_type == DOCX_MEDIA_TYPE:
        try:
            text = docx2txt.process(BytesIO(content)) or ""
        except Exception as error:
            raise DocumentParsingError(
                ParsingErrorCode.MALFORMED_DOCX,
                f"{source_name} is not a valid DOCX file or is corrupted.",
                source_name=source_name,
            ) from error
    else:
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError as error:
            raise DocumentParsingError(
                ParsingErrorCode.UNREADABLE_TEXT,
                f"{source_name} is not valid UTF-8 text and could not be read.",
                source_name=source_name,
            ) from error

    if not text.strip():
        if media_type == PDF_MEDIA_TYPE:
            raise DocumentParsingError(
                ParsingErrorCode.NO_EXTRACTABLE_TEXT,
                (
                    f"No extractable text was found in {source_name}. "
                    "Image-only PDFs require OCR, which is not supported."
                ),
                source_name=source_name,
            )
        raise DocumentParsingError(
            ParsingErrorCode.EMPTY_TEXT,
            f"{source_name} does not contain any readable text.",
            source_name=source_name,
        )

    return ExtractedDocument(
        text=text,
        source_name=source_name,
        media_type=media_type,
    )
