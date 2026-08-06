"""Stable Pydantic contracts for the Version 2 HTTP API."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from resume_screener.models import AnalysisMode


class ErrorDetail(BaseModel):
    """One machine-readable public API error or non-fatal warning."""

    code: str
    message: str
    field: str | None = None
    request_id: str | None = None


class ErrorResponse(BaseModel):
    """Envelope used by every unsuccessful API response."""

    error: ErrorDetail


class AnalysisRequestMetadata(BaseModel):
    """Typed non-file fields accepted by multipart analysis requests."""

    model_config = ConfigDict(use_enum_values=True)

    analysis_mode: AnalysisMode = AnalysisMode.SKILLS_FOCUSED
    resume_text: str = ""
    job_description_text: str = ""


class TermResult(BaseModel):
    """One ordered term exposed to the frontend."""

    term: str
    count: int = Field(default=1, ge=1)
    category: str | None = None


class CoverageSummary(BaseModel):
    """Primary lexical coverage and its component counts."""

    score: float | int | None
    matched: int = Field(ge=0)
    missing: int = Field(ge=0)
    total: int = Field(ge=0)
    label: str


class CategoryCoverageResponse(BaseModel):
    """Coverage for one curated focused-analysis category."""

    category: str
    matched: int = Field(ge=0)
    total: int = Field(ge=0)
    score: float | int | None
    display_value: str
    included_in_primary: bool


class NormalizedMatchResponse(BaseModel):
    """Explanation for an explicitly normalized focused-mode match."""

    concept: str
    resume_term: str
    job_term: str


class AnalysisMetadata(BaseModel):
    """Safe metadata about an analysis without document contents."""

    resume_label: str
    resume_count: int = Field(ge=1)
    input_mode: str
    analyzed_at: datetime


class AnalysisResponse(BaseModel):
    """Complete ordered output consumed by the Version 2 frontend."""

    model_config = ConfigDict(use_enum_values=True)

    analysis_mode: AnalysisMode
    coverage: CoverageSummary
    matched_terms: list[TermResult]
    missing_terms: list[TermResult]
    categories: list[CategoryCoverageResponse] = Field(default_factory=list)
    normalized_matches: list[NormalizedMatchResponse] = Field(default_factory=list)
    metadata: AnalysisMetadata
    warnings: list[ErrorDetail] = Field(default_factory=list)


class HealthResponse(BaseModel):
    """Minimal non-sensitive service health response."""

    status: str
    service: str
    api_version: str
