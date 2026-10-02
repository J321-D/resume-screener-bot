"""Internal deterministic fulfillment for the preregistered $9 premium review.

This module is deliberately not wired to a public endpoint. It prepares a
meaningfully richer, evidence-backed PDF artifact so payment activation is not
followed by a second product-readiness bottleneck.

No LLM, external request, durable résumé storage, or inferred credential claim
is used. Missing JD concepts are framed as review prompts only: the customer
must add them only when truthfully supported by their background.
"""
from __future__ import annotations

from dataclasses import dataclass

from api.services.analysis_service import analyze_documents
from api.services.document_service import PreparedDocuments
from api.services.evidence_service import build_v2_response
from resume_screener.models import AnalysisMode
from resume_screener.reporting import generate_pdf_report


PREMIUM_REPORT_SCHEMA = "RKS_PREMIUM_TAILORED_REVIEW_V1"
MAX_PRIORITY_ITEMS = 12
MAX_STRENGTH_ITEMS = 12
MAX_DIAGNOSTIC_ITEMS = 8


@dataclass(frozen=True)
class PremiumReviewPlan:
    schema: str
    analysis_mode: str
    coverage_label: str
    coverage_score: float | int | None
    priority_review_items: tuple[str, ...]
    represented_strength_items: tuple[str, ...]
    diagnostic_items: tuple[str, ...]
    guardrails: tuple[str, ...]


def _section_label(evidence: dict) -> str:
    section=evidence.get("source_section")
    if not isinstance(section,dict):
        return "section not detected"
    normalized=section.get("normalized_type")
    raw=section.get("raw_heading")
    if normalized:
        return str(normalized)
    if raw:
        return str(raw)
    return "section not detected"


def _first_evidence(finding: dict, source_document: str) -> dict | None:
    evidence=finding.get("evidence") if isinstance(finding.get("evidence"),list) else []
    return next(
        (
            row for row in evidence
            if isinstance(row,dict) and row.get("source_document")==source_document
        ),
        None,
    )


def _priority_items(payload: dict) -> tuple[str, ...]:
    findings=payload.get("findings") if isinstance(payload.get("findings"),list) else []
    rows=[]
    for finding in findings:
        if not isinstance(finding,dict) or finding.get("status")!="missing":
            continue
        display=str(finding.get("display_term") or "").strip()
        if not display:
            continue
        category=str(finding.get("category") or "Uncategorized")
        jd=_first_evidence(finding,"job_description")
        section=_section_label(jd or {})
        surface=str((jd or {}).get("matched_surface") or display).strip()
        rows.append(
            f'Review "{display}" ({category}; JD {section}). '
            f'The job description explicitly contains "{surface}". '
            "Add concrete résumé evidence only if it truthfully matches your experience; otherwise leave it absent."
        )
        if len(rows)>=MAX_PRIORITY_ITEMS:
            break
    if not rows:
        rows.append(
            "No missing deterministic coverage concepts were returned for this analysis. "
            "Do not add keywords merely to increase a score."
        )
    return tuple(rows)


def _strength_items(payload: dict) -> tuple[str, ...]:
    findings=payload.get("findings") if isinstance(payload.get("findings"),list) else []
    rows=[]
    for finding in findings:
        if not isinstance(finding,dict) or finding.get("status")!="matched":
            continue
        display=str(finding.get("display_term") or "").strip()
        if not display:
            continue
        resume=_first_evidence(finding,"resume")
        if not resume:
            continue
        section=_section_label(resume)
        surface=str(resume.get("matched_surface") or display).strip()
        method=str(finding.get("match_method") or "deterministic match")
        rows.append(
            f'"{display}" is represented in résumé {section} via "{surface}" '
            f"({method.replace('_',' ')})."
        )
        if len(rows)>=MAX_STRENGTH_ITEMS:
            break
    if not rows:
        rows.append("No represented deterministic coverage concepts were returned.")
    return tuple(rows)


def _diagnostic_items(payload: dict) -> tuple[str, ...]:
    diagnostics=payload.get("diagnostics") if isinstance(payload.get("diagnostics"),list) else []
    rows=[]
    for item in diagnostics:
        if not isinstance(item,dict):
            continue
        status=str(item.get("status") or "")
        if status not in {"review","unavailable"}:
            continue
        message=str(item.get("message") or "").strip()
        if message:
            rows.append(f"{status.upper()}: {message}")
        if len(rows)>=MAX_DIAGNOSTIC_ITEMS:
            break
    if not rows:
        rows.append("No deterministic review/unavailable diagnostics were returned.")
    return tuple(rows)


def build_premium_review_plan(
    documents: PreparedDocuments,
    analysis_mode: AnalysisMode,
) -> PremiumReviewPlan:
    analysis=analyze_documents(documents,analysis_mode)
    evidence=build_v2_response(documents,analysis_mode,analysis)
    payload=evidence.model_dump(mode="json")
    return PremiumReviewPlan(
        schema=PREMIUM_REPORT_SCHEMA,
        analysis_mode=analysis_mode.value,
        coverage_label=analysis.coverage.label,
        coverage_score=analysis.coverage.score,
        priority_review_items=_priority_items(payload),
        represented_strength_items=_strength_items(payload),
        diagnostic_items=_diagnostic_items(payload),
        guardrails=(
            "This is a deterministic lexical/coverage review, not a hiring or ATS-performance prediction.",
            "Never add a skill, credential, tool, responsibility, or result that is not true.",
            "Missing JD concepts are review prompts, not instructions to keyword-stuff.",
            "The service does not retain résumé/JD text after the request lifecycle.",
        ),
    )


def generate_premium_report_for_documents(
    documents: PreparedDocuments,
    analysis_mode: AnalysisMode,
) -> bytes:
    """Generate the internal premium fulfillment artifact from request-scoped data."""
    analysis=analyze_documents(documents,analysis_mode)
    plan=build_premium_review_plan(documents,analysis_mode)
    matched=[item.term for item in analysis.matched_terms]
    missing=[item.term for item in analysis.missing_terms]
    score=(
        "N/A"
        if plan.coverage_score is None
        else f"{float(plan.coverage_score):.1f}%"
    )
    return generate_pdf_report(
        set(matched),
        missing,
        analysis_mode=analysis_mode.value,
        ordered_matched_keywords=matched,
        report_title="Premium Tailored Resume Review",
        matched_label="Deterministic Coverage Represented",
        missing_label="Deterministic Coverage To Review",
        additional_sections=[
            (
                "Premium Coverage Snapshot",
                [
                    f"Contract: {plan.schema}",
                    f"{plan.coverage_label}: {score}",
                    "This premium artifact adds evidence-backed prioritization; the underlying deterministic analysis remains unchanged.",
                ],
            ),
            ("Priority Review Checklist",list(plan.priority_review_items)),
            ("Represented Strength Evidence",list(plan.represented_strength_items)),
            ("Factual Diagnostics",list(plan.diagnostic_items)),
            ("Tailoring Guardrails",list(plan.guardrails)),
        ],
    )
