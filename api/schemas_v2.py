"""Privacy-bounded provenance contracts for the additive Version 2 API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator

from api.schemas import AnalysisResponse


UnknownReason = Literal[
    "not_available",
    "not_applicable",
    "not_detected",
    "unsupported_source",
    "ambiguous",
    "parser_limitation",
]


class UnknownMetadata(BaseModel):
    """An unavailable value with an explicit machine-readable reason."""

    value: None = None
    unknown_reason: UnknownReason


class SectionReference(BaseModel):
    """A detected semantic section containing one evidence occurrence."""

    section_id: str
    raw_heading: str
    normalized_type: Literal[
        "summary",
        "experience",
        "education",
        "skills",
        "projects",
        "research",
        "publications",
        "certifications",
        "other",
    ]
    detection_method: Literal[
        "docx_heading_style",
        "pdf_emphasized_text_line",
        "standalone_known_heading",
    ]


class DocumentSectionResponse(SectionReference):
    """One exact half-open semantic section in canonical document text."""

    start: int = Field(ge=0)
    end: int = Field(ge=0)
    heading_span: SourceSpan

    @model_validator(mode="after")
    def validate_range(self) -> DocumentSectionResponse:
        if self.end <= self.start:
            raise ValueError("section end must be greater than start")
        if self.heading_span.start < self.start or self.heading_span.end > self.end:
            raise ValueError("heading span must be contained by its section")
        return self


class SectionDetectionMetadata(BaseModel):
    """A truthful summary of the available section model."""

    availability: Literal["detected"] = "detected"
    section_count: int = Field(gt=0)
    detection_methods: list[str]


class SourceSpan(BaseModel):
    """Half-open Unicode offsets into the server's canonical extracted text."""

    start: int = Field(ge=0)
    end: int = Field(ge=0)
    unit: Literal["unicode_code_point"] = "unicode_code_point"

    @model_validator(mode="after")
    def validate_order(self) -> SourceSpan:
        if self.end <= self.start:
            raise ValueError("end must be greater than start")
        return self


class RelevantKeywordEvidence(BaseModel):
    """One exact source occurrence supporting a curated relevant keyword."""

    source_document: Literal["resume", "job_description"]
    document_id: str
    source_span: SourceSpan
    matched_surface: str


class EvidenceReference(BaseModel):
    """One exact, privacy-bounded source occurrence supporting a finding."""

    evidence_id: str
    source_document: Literal["resume", "job_description"]
    document_id: str
    source_section: SectionReference | UnknownMetadata
    source_span: SourceSpan
    matched_surface: str
    normalized_term: str


class RelevantKeywordResponse(BaseModel):
    """One curated JD concept for factual résumé review."""

    keyword_id: str
    category: str
    status: Literal["matched", "missing"]
    display_term: str
    normalized_term: str
    match_method: Literal[
        "exact",
        "documented_phrase",
        "curated_synonym",
        "not_detected",
    ]
    evidence: list[RelevantKeywordEvidence]


class DocumentBlockResponse(BaseModel):
    """One contiguous display block mapped to canonical global offsets."""

    block_id: str
    start: int = Field(ge=0)
    end: int = Field(ge=0)
    text: str
    block_type: UnknownMetadata
    evidence_refs: list[str]

    @model_validator(mode="after")
    def validate_range(self) -> DocumentBlockResponse:
        if self.end <= self.start:
            raise ValueError("end must be greater than start")
        if self.end - self.start != len(self.text):
            raise ValueError("block text length must match its canonical range")
        return self


class SourceDocumentResponse(BaseModel):
    """Non-content identity metadata for one canonical parsed document."""

    document_id: str
    source_document: Literal["resume", "job_description"]
    media_type: str | None
    canonical_text_characters: int = Field(ge=0)
    offset_basis: Literal["server_canonical_extracted_text"] = (
        "server_canonical_extracted_text"
    )
    document_structure_metadata: SectionDetectionMetadata | UnknownMetadata
    formatting_metadata: UnknownMetadata
    blocks: list[DocumentBlockResponse]
    sections: list[DocumentSectionResponse]


class AnalysisFindingResponse(BaseModel):
    """One stable matched or missing lexical coverage finding."""

    finding_id: str
    comparison_key: str
    rule_id: Literal[
        "full_lexical.token_coverage",
        "skills_focused.concept_coverage",
    ]
    category: str | None
    status: Literal["matched", "missing"]
    reason: Literal["exact_match", "curated_normalization", "not_detected"]
    display_term: str
    normalized_term: str
    match_method: Literal[
        "exact",
        "documented_phrase",
        "curated_synonym",
        "not_detected",
    ]
    evidence: list[EvidenceReference]
    unavailable_evidence_reason: UnknownReason | None = None


class DiagnosticFindingResponse(BaseModel):
    """One user-relevant deterministic rule result for this analysis."""

    diagnostic_id: str
    rule_id: Literal[
        "document.text_extracted",
        "document.semantic_sections",
        "document.repeated_section_type",
        "coverage.threshold_30_percent",
        "coverage.opportunities_present",
    ]
    rule_group: Literal["document", "structure", "coverage"]
    status: Literal["pass", "review", "unavailable"]
    reason_code: str
    source_document_id: str | None = None
    evidence_refs: list[str] = Field(default_factory=list)
    message: str


class AnalysisV2Response(BaseModel):
    """Unchanged v1 analysis plus authoritative, bounded provenance."""

    contract_version: Literal["2.0"] = "2.0"
    analysis: AnalysisResponse
    source_documents: list[SourceDocumentResponse]
    findings: list[AnalysisFindingResponse]
    diagnostics: list[DiagnosticFindingResponse]
    relevant_keywords: list[RelevantKeywordResponse] = Field(default_factory=list)
