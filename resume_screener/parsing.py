"""Shared uploaded-document parsing with baseline-compatible behavior."""

from __future__ import annotations

from typing import Protocol

import docx2txt
import fitz

from resume_screener.models import ExtractedDocument


PDF_MEDIA_TYPE = "application/pdf"
DOCX_MEDIA_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


class UploadedDocument(Protocol):
    """The uploaded-file attributes consumed by the baseline parser."""

    name: str
    type: str

    def read(self, size: int = -1) -> bytes:
        """Read uploaded bytes."""


def parse_uploaded_document(uploaded_document: UploadedDocument) -> ExtractedDocument:
    """Extract text using the baseline MIME dispatch and parser behavior."""
    text = ""
    if uploaded_document.type == PDF_MEDIA_TYPE:
        with fitz.open(stream=uploaded_document.read(), filetype="pdf") as document:
            for page in document:
                text += page.get_text()
    elif uploaded_document.type == DOCX_MEDIA_TYPE:
        text = docx2txt.process(uploaded_document)
    else:
        text = uploaded_document.read().decode("utf-8", errors="ignore")

    return ExtractedDocument(
        text=text,
        source_name=uploaded_document.name,
        media_type=uploaded_document.type,
    )
