"""Server-side PDF export using the existing Unicode report engine."""

from __future__ import annotations

from api.services.document_service import PreparedDocuments
from api.services.relevant_keyword_service import build_relevant_keywords
from resume_screener.analysis import (
    aggregate_resume_words,
    calculate_matched_words,
    calculate_missing_words,
    extract_keywords,
    rank_missing_keywords,
)
from resume_screener.models import AnalysisMode, ConceptCategory
from resume_screener.reporting import generate_pdf_report
from resume_screener.sections import detect_sections
from resume_screener.skills.matcher import analyze_skills_focused


def generate_report_for_documents(
    documents: PreparedDocuments,
    analysis_mode: AnalysisMode,
) -> bytes:
    """Recompute validated inputs and delegate PDF construction unchanged."""
    resume_texts = [document.text for document in documents.resumes]
    job_text = documents.job_description.text
    document_section_summaries = []
    for index, document in enumerate(documents.resumes, start=1):
        sections = detect_sections(document, f"resume_{index}")
        label = f"Resume {index}"
        document_section_summaries.append(
            f"{label}: "
            + (
                ", ".join(section.normalized_type for section in sections)
                if sections
                else "semantic sections unavailable"
            )
        )
    job_sections = detect_sections(documents.job_description, "job_description_1")
    document_section_summaries.append(
        "Job description: "
        + (
            ", ".join(section.normalized_type for section in job_sections)
            if job_sections
            else "semantic sections unavailable"
        )
    )
    if analysis_mode is AnalysisMode.FULL_LEXICAL:
        resume_words = aggregate_resume_words(resume_texts)
        job_words = extract_keywords(job_text)
        matched = calculate_matched_words(resume_words, job_words)
        missing = calculate_missing_words(resume_words, job_words)
        ranked = rank_missing_keywords(job_text, missing, "")
        relevant_keywords = build_relevant_keywords(documents)
        relevant_represented = [
            item.display_term
            for item in relevant_keywords
            if item.status == "matched"
        ]
        relevant_missing = [
            item.display_term
            for item in relevant_keywords
            if item.status == "missing"
        ]
        return generate_pdf_report(
            matched,
            ranked.filtered,
            analysis_mode=analysis_mode.value,
            document_section_summaries=document_section_summaries,
            report_title="Raw Lexical Overlap Report",
            matched_label="Exact Terms Shared",
            missing_label="Unmatched JD Terms",
            additional_sections=[
                (
                    "Relevant Keyword Review",
                    [
                        f"Represented Curated Concepts: {relevant_represented}",
                        f"Curated Concepts To Review: {relevant_missing}",
                        "This curated review is separate from the raw lexical score.",
                    ],
                )
            ],
        )

    result = analyze_skills_focused(resume_texts, job_text)
    categorized_matched = [
        item
        for item in result.matched
        if item.category is not ConceptCategory.UNCATEGORIZED
    ]
    categorized_missing = [
        item
        for item in result.missing
        if item.category is not ConceptCategory.UNCATEGORIZED
    ]
    ordered_matched = [item.display_term for item in categorized_matched]
    ordered_missing = [
        item.display_term
        for item in sorted(categorized_missing, key=lambda item: -item.count)
    ]
    return generate_pdf_report(
        {item.concept for item in categorized_matched},
        ordered_missing,
        analysis_mode=analysis_mode.value,
        category_coverage=result.category_coverage,
        explanations=result.explanations,
        ordered_matched_keywords=ordered_matched,
        primary_coverage=result.primary_coverage,
        document_section_summaries=document_section_summaries,
        report_title="Categorized Keyword Coverage Report",
        matched_label="Curated Concepts Represented",
        missing_label="Curated Concepts To Review",
    )
