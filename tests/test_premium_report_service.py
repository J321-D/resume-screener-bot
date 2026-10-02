"""Tests for internal-only deterministic premium fulfillment."""

from __future__ import annotations

import fitz
from fastapi.testclient import TestClient

from api.main import app
from api.services.document_service import PreparedDocuments
from api.services.premium_report_service import (
    PREMIUM_REPORT_SCHEMA,
    build_premium_review_plan,
    generate_premium_report_for_documents,
)
from resume_screener.models import AnalysisMode, ExtractedDocument


def _documents() -> PreparedDocuments:
    return PreparedDocuments(
        resumes=[
            ExtractedDocument(
                text=(
                    "SKILLS\nPython quality control\n\n"
                    "EXPERIENCE\nBuilt Python validation tools"
                ),
                source_name="resume.txt",
                media_type="text/plain",
            )
        ],
        job_description=ExtractedDocument(
            text=(
                "SKILLS\nPython quality control SQL\n\n"
                "EXPERIENCE\nprocess validation technology transfer"
            ),
            source_name="job.txt",
            media_type="text/plain",
        ),
        resume_label="resume.txt",
        input_mode="files",
        warnings=[],
    )


def _pdf_text(data: bytes) -> str:
    with fitz.open(stream=data,filetype="pdf") as document:
        return " ".join(" ".join(page.get_text().split()) for page in document)


def test_premium_plan_is_evidence_backed_and_truthfulness_bounded():
    plan=build_premium_review_plan(_documents(),AnalysisMode.SKILLS_FOCUSED)

    assert plan.schema==PREMIUM_REPORT_SCHEMA
    assert plan.coverage_label=="Categorized Keyword Coverage"
    assert any("SQL" in row for row in plan.priority_review_items)
    assert any("quality control" in row.lower() for row in plan.represented_strength_items)
    assert all("truthfully" in row or "No missing" in row for row in plan.priority_review_items)
    assert any("Never add a skill" in row for row in plan.guardrails)
    assert any("keyword-stuff" in row for row in plan.guardrails)


def test_premium_pdf_contains_real_differentiated_fulfillment_sections():
    pdf=generate_premium_report_for_documents(
        _documents(),AnalysisMode.SKILLS_FOCUSED
    )
    assert pdf.startswith(b"%PDF-")
    text=_pdf_text(pdf)

    assert "Premium Tailored Resume Review" in text
    assert "Premium Coverage Snapshot:" in text
    assert "Priority Review Checklist:" in text
    assert "Represented Strength Evidence:" in text
    assert "Factual Diagnostics:" in text
    assert "Tailoring Guardrails:" in text
    assert PREMIUM_REPORT_SCHEMA in text
    assert "SQL" in text
    assert "Never add a skill" in text
    assert "not a hiring or ATS-performance prediction" in text


def test_premium_plan_does_not_invent_missing_resume_evidence():
    plan=build_premium_review_plan(
        PreparedDocuments(
            resumes=[ExtractedDocument(text="Python",source_name="r.txt")],
            job_description=ExtractedDocument(
                text="Python SQL MATLAB",source_name="j.txt"
            ),
            resume_label="r.txt",
            input_mode="pasted_text",
            warnings=[],
        ),
        AnalysisMode.FULL_LEXICAL,
    )

    joined=" ".join(plan.priority_review_items)
    assert "SQL" in joined and "MATLAB" in joined
    assert "Add concrete résumé evidence only if it truthfully matches your experience" in joined
    assert "represented in résumé" not in joined.lower()


def test_premium_fulfillment_stays_internal_until_checkout_gate_is_connected():
    schema=TestClient(app).get("/openapi.json").json()
    paths=set(schema["paths"])

    assert "/api/v1/report" in paths
    assert all("premium" not in path.lower() for path in paths)


def test_premium_report_uses_no_storage_or_external_provider_contract():
    # The internal service is a pure request-scoped transformation: this is an
    # explicit contract test against accidental future checkout/network coupling.
    import inspect
    import api.services.premium_report_service as premium

    source=inspect.getsource(premium)
    forbidden=(
        "requests.",
        "urllib.",
        "httpx.",
        "openai",
        "anthropic",
        "sqlite3",
        "write_text(",
        "open(",
    )
    assert all(token not in source for token in forbidden)
