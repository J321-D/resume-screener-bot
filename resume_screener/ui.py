"""Presentation-only Streamlit components for the recruiter-facing workflow."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import pandas as pd
import plotly.express as px
import streamlit as st

from resume_screener.models import (
    AnalysisMode,
    CategoryCoverage,
    ConceptCategory,
    ExtractedDocument,
    NormalizedMatchExplanation,
)
from resume_screener.parsing import MAX_UPLOAD_SIZE_MB
from resume_screener.reporting import generate_pdf_report


def render_header() -> None:
    """Render the product identity, explanation, and assessment disclaimer."""
    st.markdown(
        """
        <section class="rks-hero">
            <div class="rks-eyebrow">Recruiter workflow</div>
            <h1>Resume Keyword Screener</h1>
            <p class="rks-hero-copy">
                Compare résumé language with a job description and review lexical
                keyword coverage in one focused workspace.
            </p>
            <p class="rks-disclaimer">
                Lexical keyword comparison—not a candidate-performance assessment.
            </p>
        </section>
        """,
        unsafe_allow_html=True,
    )


def render_analysis_mode_selector() -> AnalysisMode:
    """Render the compact deterministic analysis-mode control."""
    selected = st.radio(
        "Analysis mode",
        options=[mode.value for mode in AnalysisMode],
        horizontal=True,
        help=(
            "Skills-focused analysis filters filler words and uses only curated "
            "phrases and synonyms. Full lexical analysis preserves v1.0 behavior."
        ),
    )
    if selected == AnalysisMode.SKILLS_FOCUSED.value:
        st.caption(
            "Relevance-focused lexical comparison—not an ATS prediction or "
            "hiring assessment."
        )
    else:
        st.caption("v1.0-compatible full lexical keyword comparison.")
    return AnalysisMode(selected)


def render_input_panels() -> tuple[list[Any], Any | None, str, str]:
    """Render desktop columns that naturally stack at narrow widths."""
    st.subheader("Candidate and role inputs")
    resume_column, job_column = st.columns(2, gap="large")

    with resume_column:
        st.markdown('<div class="rks-panel-label">Résumé content</div>', unsafe_allow_html=True)
        st.markdown(
            '<div class="rks-panel-copy">Upload one or more files, paste text, or use both.</div>',
            unsafe_allow_html=True,
        )
        uploaded_resumes = st.file_uploader(
            "Upload your resume(s) (PDF, DOCX, TXT)",
            type=["pdf", "docx", "txt"],
            accept_multiple_files=True,
            help=f"Maximum file size: {MAX_UPLOAD_SIZE_MB} MB per file.",
        )
        resume_text_manual = st.text_area("Paste your resume here:", height=260)

    with job_column:
        st.markdown('<div class="rks-panel-label">Job description</div>', unsafe_allow_html=True)
        st.markdown(
            '<div class="rks-panel-copy">Upload one role description or paste its text.</div>',
            unsafe_allow_html=True,
        )
        uploaded_job_description = st.file_uploader(
            "Upload job description (PDF, DOCX, TXT)",
            type=["pdf", "docx", "txt"],
            key="jd",
            help=f"Maximum file size: {MAX_UPLOAD_SIZE_MB} MB per file.",
        )
        job_description_text_manual = st.text_area(
            "Paste the job description here:",
            height=260,
        )

    return (
        uploaded_resumes or [],
        uploaded_job_description,
        resume_text_manual,
        job_description_text_manual,
    )


def render_preview_expanders(
    resume_documents: list[ExtractedDocument],
    job_description_document: ExtractedDocument | None,
) -> None:
    """Render available document previews, collapsed by default."""
    if not resume_documents and job_description_document is None:
        return

    st.markdown('<div class="rks-section-rule"></div>', unsafe_allow_html=True)
    st.subheader("Document previews")
    resume_column, job_column = st.columns(2, gap="large")

    with resume_column:
        if resume_documents:
            with st.expander("Résumé preview", expanded=False):
                for document in resume_documents:
                    st.text(document.text[:2000])

    with job_column:
        if job_description_document is not None:
            with st.expander("Job description preview", expanded=False):
                st.text(job_description_document.text[:2000])


def render_keyword_coverage_summary(
    match_score: float | int,
    matched_count: int,
    missing_count: int,
    total_job_description_tokens: int,
    *,
    show_low_score_warning: bool,
    score_label: str = "Keyword coverage",
    analysis_caption: str | None = None,
) -> None:
    """Render the existing score with neutral lexical-coverage framing."""
    st.markdown('<div class="rks-section-rule"></div>', unsafe_allow_html=True)
    st.subheader("Coverage overview")
    score_column, matched_column, missing_column, total_column = st.columns(4)
    score_column.metric(score_label, f"{match_score}%")
    matched_column.metric("Matched", matched_count)
    missing_column.metric("Missing", missing_count)
    total_column.metric("Unique JD tokens", total_job_description_tokens)
    st.caption(
        analysis_caption
        or "Multiple supplied résumés are combined for this lexical comparison."
    )

    if show_low_score_warning:
        st.warning(
            "📉 Low match score — consider revising your resume to include more relevant keywords."
        )


def render_category_coverage(
    category_coverage: dict[ConceptCategory, CategoryCoverage],
) -> None:
    """Render deterministic category scores, including the explicit fallback."""
    st.subheader("Category coverage")
    columns = st.columns(3)
    for index, category in enumerate(ConceptCategory):
        coverage = category_coverage[category]
        columns[index % len(columns)].metric(
            category.value,
            coverage.display_value,
            help=(
                f"{coverage.matched} of {coverage.total} job concepts matched"
                if coverage.total
                else "No applicable job-description concepts in this category"
            ),
        )


def render_normalized_match_explanations(
    explanations: list[NormalizedMatchExplanation],
) -> None:
    """Render explicit normalized matches in a collapsed disclosure."""
    if not explanations:
        return
    with st.expander("Normalized match explanations", expanded=False):
        for explanation in explanations:
            st.markdown(
                f"- `{explanation.resume_term}` matched "
                f"`{explanation.job_term}` as **{explanation.concept}**"
            )


def render_keyword_panels(
    matched_keywords: list[str],
    missing_keywords: list[str],
) -> None:
    """Render the already-ordered keyword collections without transforming them."""
    st.subheader("Keyword details")
    matched_column, missing_column = st.columns(2, gap="large")

    with matched_column:
        with st.container(border=True):
            st.markdown("#### Matched keywords")
            st.caption(f"{len(matched_keywords)} terms found in the supplied résumé content")
            st.json(matched_keywords)

    with missing_column:
        with st.container(border=True):
            st.markdown("#### Missing keywords")
            st.caption(f"{len(missing_keywords)} terms shown using the current ranking")
            st.json(missing_keywords)


def render_visualizations(
    filtered_missing_keywords: list[str],
    missing_keyword_counts: Mapping[str, int],
    matched_keywords: set[str],
    job_description_keywords: set[str],
    *,
    focused_skill_terms: list[tuple[str, bool]] | None = None,
) -> None:
    """Render the existing charts after the keyword collections."""
    st.subheader("Visualizations")

    if st.checkbox("📉 Show bar chart of missing keywords"):
        top_list = filtered_missing_keywords[:20]
        counts = [missing_keyword_counts[word] for word in top_list]
        missing_figure = px.bar(
            x=top_list,
            y=counts,
            labels={"x": "Keywords", "y": "Frequency"},
            title="Top Missing Keywords",
        )
        st.plotly_chart(missing_figure)

    if focused_skill_terms is not None:
        skills_in_job = [term for term, _ in focused_skill_terms]
        skill_presence = [int(is_matched) for _, is_matched in focused_skill_terms]
    else:
        skills_in_resume = list(matched_keywords)
        skills_in_job = list(job_description_keywords)
        skill_presence = [
            1 if skill in skills_in_resume else 0 for skill in skills_in_job
        ]
    skill_matrix_data = {
        "Skills": skills_in_job,
        "In Resume": skill_presence,
    }
    skill_matrix = pd.DataFrame(skill_matrix_data)
    skill_figure = px.bar(
        skill_matrix,
        x="Skills",
        y="In Resume",
        title="Skills Comparison",
        labels={"Skills": "Skill", "In Resume": "Presence"},
    )
    st.plotly_chart(skill_figure)


def render_pdf_download(
    matched_keywords: set[str],
    filtered_missing_keywords: list[str],
    *,
    analysis_mode: AnalysisMode = AnalysisMode.FULL_LEXICAL,
    category_coverage: dict[ConceptCategory, CategoryCoverage] | None = None,
    explanations: list[NormalizedMatchExplanation] | None = None,
    ordered_matched_keywords: list[str] | None = None,
) -> None:
    """Render the existing two-step PDF generation and download workflow."""
    st.subheader("Export")
    if st.button("⬇️ Download Report as PDF"):
        pdf_bytes = generate_pdf_report(
            matched_keywords,
            filtered_missing_keywords,
            analysis_mode=analysis_mode.value,
            category_coverage=category_coverage,
            explanations=explanations or [],
            ordered_matched_keywords=ordered_matched_keywords,
        )
        st.download_button(
            "📥 Click here to download PDF",
            data=pdf_bytes,
            file_name="report.pdf",
            mime="application/pdf",
        )


def render_footer() -> None:
    """Render a concise product footer."""
    st.markdown(
        '<div class="rks-footer">Resume Keyword Screener · Local lexical analysis</div>',
        unsafe_allow_html=True,
    )
