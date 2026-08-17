"""Shared uploaded-document parsing with typed, user-safe failures."""

from __future__ import annotations

from enum import Enum
from io import BytesIO
from typing import Protocol
from xml.etree import ElementTree
from zipfile import ZipFile

import docx2txt
import fitz

from resume_screener.models import DocumentHeadingHint, ExtractedDocument
from resume_screener.sections import normalize_heading


PDF_MEDIA_TYPE = "application/pdf"
DOCX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)
TXT_MEDIA_TYPE = "text/plain"
MAX_UPLOAD_SIZE_MB = 10
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
SUPPORTED_MEDIA_TYPES = {PDF_MEDIA_TYPE, DOCX_MEDIA_TYPE, TXT_MEDIA_TYPE}
_WORD_NAMESPACE = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def _map_exact_heading(text: str, raw: str, cursor: int) -> tuple[int, int] | None:
    """Map parser metadata only when its exact surface exists canonically."""
    start = text.find(raw, cursor)
    if start < 0:
        return None
    return start, start + len(raw)


def _docx_heading_hints(content: bytes, text: str) -> tuple[DocumentHeadingHint, ...]:
    hints: list[DocumentHeadingHint] = []
    cursor = 0
    with ZipFile(BytesIO(content)) as archive:
        root = ElementTree.fromstring(archive.read("word/document.xml"))
    for paragraph in root.iter(f"{_WORD_NAMESPACE}p"):
        raw = "".join(node.text or "" for node in paragraph.iter(f"{_WORD_NAMESPACE}t"))
        style = paragraph.find(f"{_WORD_NAMESPACE}pPr/{_WORD_NAMESPACE}pStyle")
        style_name = style.get(f"{_WORD_NAMESPACE}val", "") if style is not None else ""
        mapping = _map_exact_heading(text, raw, cursor) if raw else None
        if mapping is not None:
            cursor = mapping[1]
        if (
            mapping is not None
            and style_name.casefold().replace(" ", "").startswith("heading")
            and normalize_heading(raw) is not None
        ):
            hints.append(
                DocumentHeadingHint(
                    start=mapping[0],
                    end=mapping[1],
                    raw_heading=raw,
                    detection_method="docx_heading_style",
                )
            )
    return tuple(hints)


def _pdf_heading_hints(document: fitz.Document, text: str) -> tuple[DocumentHeadingHint, ...]:
    hints: list[DocumentHeadingHint] = []
    page_offset = 0
    for page in document:
        page_text = page.get_text()
        page_sizes: list[float] = []
        candidates: list[tuple[str, float, int]] = []
        for block in page.get_text("dict").get("blocks", []):
            for line in block.get("lines", []):
                spans = line.get("spans", [])
                raw = "".join(span.get("text", "") for span in spans).strip()
                if not raw or not spans:
                    continue
                sizes = [float(span.get("size", 0)) for span in spans if span.get("text")]
                page_sizes.extend(sizes)
                flags = 0
                for span in spans:
                    flags |= int(span.get("flags", 0))
                candidates.append((raw, max(sizes, default=0), flags))
        body_size = sorted(page_sizes)[len(page_sizes) // 2] if page_sizes else 0
        cursor = 0
        for raw, size, flags in candidates:
            local = page_text.find(raw, cursor)
            if local < 0:
                continue
            cursor = local + len(raw)
            emphasized = size > body_size + 0.5 or bool(flags & (1 << 4))
            if emphasized and normalize_heading(raw) is not None:
                hints.append(
                    DocumentHeadingHint(
                        start=page_offset + local,
                        end=page_offset + local + len(raw),
                        raw_heading=raw,
                        detection_method="pdf_emphasized_text_line",
                    )
                )
        page_offset += len(page_text)
    return tuple(hints)


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
                heading_hints = _pdf_heading_hints(document, text)
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
            heading_hints = _docx_heading_hints(content, text)
        except Exception as error:
            raise DocumentParsingError(
                ParsingErrorCode.MALFORMED_DOCX,
                f"{source_name} is not a valid DOCX file or is corrupted.",
                source_name=source_name,
            ) from error
    else:
        try:
            text = content.decode("utf-8")
            heading_hints = ()
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
        heading_hints=heading_hints,
    )
