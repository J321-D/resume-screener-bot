"""Bounded multipart upload adaptation for the synchronous parser contract."""

from __future__ import annotations

import re
from dataclasses import dataclass
from io import BytesIO
from pathlib import PurePath
from zipfile import BadZipFile, ZipFile

from fastapi import UploadFile

from api.errors import PublicApiError
from resume_screener.models import ExtractedDocument
from resume_screener.parsing import (
    DOCX_MEDIA_TYPE,
    MAX_UPLOAD_SIZE_BYTES,
    PDF_MEDIA_TYPE,
    TXT_MEDIA_TYPE,
    DocumentParsingError,
    parse_uploaded_document,
)


MAX_RESUME_UPLOADS = 5
MAX_TOTAL_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024
READ_CHUNK_SIZE = 1024 * 1024
_CONTROL_CHARACTERS = re.compile(r"[\x00-\x1f\x7f]")
_EXPECTED_SUFFIX = {
    PDF_MEDIA_TYPE: ".pdf",
    DOCX_MEDIA_TYPE: ".docx",
    TXT_MEDIA_TYPE: ".txt",
}


@dataclass
class BufferedUpload:
    """In-memory implementation of the established parser upload protocol."""

    content: bytes
    name: str
    type: str

    def __post_init__(self) -> None:
        self.size = len(self.content)
        self._buffer = BytesIO(self.content)

    def read(self, size: int = -1) -> bytes:
        return self._buffer.read(size)


@dataclass(frozen=True)
class PreparedDocuments:
    """Validated inputs and safe presentation metadata for one request."""

    resumes: list[ExtractedDocument]
    job_description: ExtractedDocument
    resume_label: str
    input_mode: str
    warnings: list[PublicApiError]


def safe_filename(filename: str | None, *, fallback: str = "document") -> str:
    """Reduce an untrusted upload name to a short path-free display label."""
    source = (filename or fallback).replace("\\", "/")
    basename = PurePath(source).name
    cleaned = _CONTROL_CHARACTERS.sub("", basename).strip().strip(".")
    return (cleaned or fallback)[:180]


def unique_labels(names: list[str]) -> list[str]:
    """Disambiguate duplicate display names while preserving source order."""
    occurrences: dict[str, int] = {}
    labels: list[str] = []
    for name in names:
        key = name.casefold()
        occurrences[key] = occurrences.get(key, 0) + 1
        occurrence = occurrences[key]
        if occurrence == 1:
            labels.append(name)
            continue
        path = PurePath(name)
        suffix = path.suffix
        stem = name[: -len(suffix)] if suffix else name
        labels.append(f"{stem} ({occurrence}){suffix}")
    return labels


async def _read_bounded(
    upload: UploadFile,
    *,
    total_bytes: int,
    field: str,
) -> tuple[bytes, int]:
    """Read one upload incrementally and enforce per-file and request limits."""
    chunks: list[bytes] = []
    file_bytes = 0
    while True:
        chunk = await upload.read(READ_CHUNK_SIZE)
        if not chunk:
            break
        file_bytes += len(chunk)
        total_bytes += len(chunk)
        if file_bytes > MAX_UPLOAD_SIZE_BYTES:
            raise PublicApiError(
                413,
                "file_too_large",
                "Each uploaded file must be 10 MB or smaller.",
                field,
            )
        if total_bytes > MAX_TOTAL_UPLOAD_SIZE_BYTES:
            raise PublicApiError(
                413,
                "request_too_large",
                "The combined upload size must be 25 MB or smaller.",
                field,
            )
        chunks.append(chunk)
    if not chunks:
        raise PublicApiError(
            422,
            "empty_file",
            f"{safe_filename(upload.filename)} is empty. Choose a readable file.",
            field,
        )
    return b"".join(chunks), total_bytes


def _detect_media_type(content: bytes) -> str | None:
    if content.startswith(b"%PDF-"):
        return PDF_MEDIA_TYPE
    if content.startswith(b"PK"):
        try:
            with ZipFile(BytesIO(content)) as archive:
                names = set(archive.namelist())
            if "[Content_Types].xml" in names and "word/document.xml" in names:
                return DOCX_MEDIA_TYPE
        except BadZipFile:
            return None
    try:
        content.decode("utf-8")
    except UnicodeDecodeError:
        return None
    return TXT_MEDIA_TYPE


def _validated_media_type(
    content: bytes,
    filename: str,
    reported_media_type: str | None,
    field: str,
) -> str:
    detected = _detect_media_type(content)
    suffix = PurePath(filename).suffix.lower()
    if detected is None or _EXPECTED_SUFFIX.get(detected) != suffix:
        raise PublicApiError(
            415,
            "unsupported_file_type",
            f"{filename} must be a valid PDF, DOCX, or UTF-8 TXT file.",
            field,
        )
    if reported_media_type and reported_media_type not in {
        detected,
        "application/octet-stream",
    }:
        raise PublicApiError(
            415,
            "media_type_mismatch",
            f"{filename} does not match its reported file type.",
            field,
        )
    return detected


def _parse_buffered(
    content: bytes,
    filename: str,
    media_type: str,
    field: str,
) -> ExtractedDocument:
    try:
        return parse_uploaded_document(
            BufferedUpload(content=content, name=filename, type=media_type)
        )
    except DocumentParsingError as error:
        raise PublicApiError(422, error.code.value, error.user_message, field) from error


async def prepare_documents(
    resume_uploads: list[UploadFile],
    job_description_upload: UploadFile | None,
    resume_text: str,
    job_description_text: str,
) -> PreparedDocuments:
    """Validate request inputs while preserving Streamlit precedence semantics."""
    if len(resume_uploads) > MAX_RESUME_UPLOADS:
        for upload in resume_uploads:
            await upload.close()
        raise PublicApiError(
            422,
            "too_many_resumes",
            f"Upload no more than {MAX_RESUME_UPLOADS} résumé files at once.",
            "resumes",
        )

    total_bytes = 0
    resumes: list[ExtractedDocument] = []
    warnings: list[PublicApiError] = []
    safe_names = unique_labels(
        [safe_filename(upload.filename, fallback="resume") for upload in resume_uploads]
    )
    for upload, display_name in zip(resume_uploads, safe_names):
        try:
            content, total_bytes = await _read_bounded(
                upload, total_bytes=total_bytes, field="resumes"
            )
            media_type = _validated_media_type(
                content, display_name, upload.content_type, "resumes"
            )
            resumes.append(
                _parse_buffered(content, display_name, media_type, "resumes")
            )
        except PublicApiError as error:
            warnings.append(error)
        finally:
            await upload.close()

    stripped_resume_text = resume_text.strip()
    if stripped_resume_text:
        resumes.append(ExtractedDocument(text=resume_text, source_name="Pasted résumé"))

    job_document: ExtractedDocument | None = None
    if job_description_upload is not None:
        display_name = safe_filename(
            job_description_upload.filename, fallback="job-description"
        )
        try:
            content, total_bytes = await _read_bounded(
                job_description_upload,
                total_bytes=total_bytes,
                field="job_description_file",
            )
            media_type = _validated_media_type(
                content,
                display_name,
                job_description_upload.content_type,
                "job_description_file",
            )
            job_document = _parse_buffered(
                content, display_name, media_type, "job_description_file"
            )
        except PublicApiError as error:
            if job_description_text.strip():
                warnings.append(error)
            else:
                raise
        finally:
            await job_description_upload.close()

    if job_description_text.strip():
        job_document = ExtractedDocument(
            text=job_description_text,
            source_name="Pasted job description",
        )

    if not resumes:
        if warnings:
            raise warnings[0]
        raise PublicApiError(
            422,
            "missing_resume",
            "Add at least one readable résumé file or paste résumé text.",
            "resumes",
        )
    if job_document is None:
        raise PublicApiError(
            422,
            "missing_job_description",
            "Upload or paste a readable job description.",
            "job_description",
        )

    labels = [document.source_name or "Pasted résumé" for document in resumes]
    resume_label = labels[0] if len(labels) == 1 else f"Combined résumés ({len(labels)})"
    input_mode = (
        "files_and_text"
        if resume_uploads and stripped_resume_text
        else "files"
        if resume_uploads
        else "pasted_text"
    )
    return PreparedDocuments(
        resumes=resumes,
        job_description=job_document,
        resume_label=resume_label,
        input_mode=input_mode,
        warnings=warnings,
    )
