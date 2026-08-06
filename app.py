import streamlit as st

from resume_screener.analysis import (
    aggregate_resume_words,
    calculate_match_score,
    calculate_matched_words,
    calculate_missing_words,
    extract_keywords,
    rank_missing_keywords,
)
from resume_screener.models import AnalysisResult, ExtractedDocument
from resume_screener.parsing import parse_uploaded_document
from resume_screener.styles import apply_app_styles
from resume_screener.ui import (
    render_footer,
    render_header,
    render_input_panels,
    render_keyword_coverage_summary,
    render_keyword_panels,
    render_pdf_download,
    render_preview_expanders,
    render_visualizations,
)


st.set_page_config(page_title="Resume Keyword Screener", layout="wide")
apply_app_styles()
render_header()

(
    uploaded_resumes,
    uploaded_job_description,
    resume_text_manual,
    job_description_text_manual,
) = render_input_panels()

resume_documents: list[ExtractedDocument] = []
job_description_document: ExtractedDocument | None = None
resume_uploaded = False
job_description_uploaded = False

if uploaded_resumes:
    resume_uploaded = True
    for uploaded_resume in uploaded_resumes:
        resume_documents.append(parse_uploaded_document(uploaded_resume))

if uploaded_job_description:
    job_description_uploaded = True
    job_description_document = parse_uploaded_document(uploaded_job_description)

# Preserve the current precedence: manual resume text is additive, while manual
# job-description text replaces an uploaded job description.
if resume_text_manual.strip():
    resume_documents.append(ExtractedDocument(text=resume_text_manual))
    resume_uploaded = True

if job_description_text_manual.strip():
    job_description_document = ExtractedDocument(text=job_description_text_manual)
    job_description_uploaded = True

render_preview_expanders(resume_documents, job_description_document)

if resume_uploaded and job_description_uploaded:
    resume_words = aggregate_resume_words(
        document.text for document in resume_documents
    )
    job_description_text = job_description_document.text
    job_description_words = extract_keywords(job_description_text)

    matched = calculate_matched_words(resume_words, job_description_words)
    missing = calculate_missing_words(resume_words, job_description_words)
    match_score = calculate_match_score(matched, job_description_words)
    analysis_result = AnalysisResult(
        resume_words=resume_words,
        job_description_words=job_description_words,
        matched=matched,
        missing=missing,
        match_score=match_score,
    )

    matched = analysis_result.matched
    missing = analysis_result.missing
    match_score = analysis_result.match_score
    job_description_words = analysis_result.job_description_words

    render_keyword_coverage_summary(
        match_score,
        len(matched),
        len(missing),
        len(job_description_words),
        show_low_score_warning=match_score < 30,
    )

    keyword_filter = st.text_input("🔎 Filter Keywords (optional):")
    filtered_matched = (
        sorted(
            [
                word
                for word in matched
                if keyword_filter.lower() in word.lower()
            ]
        )
        if keyword_filter
        else sorted(matched, key=lambda word: (-len(word), word))
    )
    missing_keyword_ranking = rank_missing_keywords(
        job_description_text,
        missing,
        keyword_filter,
    )

    render_keyword_panels(
        filtered_matched,
        missing_keyword_ranking.displayed,
    )
    render_visualizations(
        missing_keyword_ranking.filtered,
        missing_keyword_ranking.counts,
        matched,
        job_description_words,
    )
    render_pdf_download(matched, missing_keyword_ranking.filtered)

render_footer()
