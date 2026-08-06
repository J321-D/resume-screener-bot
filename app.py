import streamlit as st

from resume_screener.analysis import (
    aggregate_resume_words,
    calculate_match_score,
    calculate_matched_words,
    calculate_missing_words,
    extract_keywords,
    rank_missing_keywords,
)
from resume_screener.models import (
    AnalysisMode,
    AnalysisResult,
    ConceptCategory,
    ExtractedDocument,
)
from resume_screener.parsing import DocumentParsingError, parse_uploaded_document
from resume_screener.styles import apply_app_styles
from resume_screener.skills.matcher import analyze_skills_focused
from resume_screener.ui import (
    render_analysis_mode_selector,
    render_category_coverage,
    render_footer,
    render_header,
    render_input_panels,
    render_keyword_coverage_summary,
    render_keyword_panels,
    render_normalized_match_explanations,
    render_pdf_download,
    render_preview_expanders,
    render_visualizations,
)


st.set_page_config(page_title="Resume Keyword Screener", layout="wide")
apply_app_styles()
render_header()
analysis_mode = render_analysis_mode_selector()

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
    for uploaded_resume in uploaded_resumes:
        try:
            resume_documents.append(parse_uploaded_document(uploaded_resume))
        except DocumentParsingError as error:
            st.error(error.user_message)
    resume_uploaded = bool(resume_documents)

if uploaded_job_description:
    try:
        job_description_document = parse_uploaded_document(
            uploaded_job_description
        )
        job_description_uploaded = True
    except DocumentParsingError as error:
        st.error(error.user_message)

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
    job_description_text = job_description_document.text
    if analysis_mode is AnalysisMode.FULL_LEXICAL:
        resume_words = aggregate_resume_words(
            document.text for document in resume_documents
        )
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
        render_pdf_download(
            matched,
            missing_keyword_ranking.filtered,
            analysis_mode=analysis_mode,
        )
    else:
        focused_result = analyze_skills_focused(
            (document.text for document in resume_documents),
            job_description_text,
        )
        render_keyword_coverage_summary(
            focused_result.overall_score,
            len(focused_result.matched),
            len(focused_result.missing),
            len(focused_result.job_concepts),
            show_low_score_warning=focused_result.overall_score < 30,
            score_label="Overall coverage",
            analysis_caption=(
                "Skills-focused relevance coverage using deterministic curated "
                "phrases and synonyms. Supplied résumés are combined."
            ),
        )
        render_category_coverage(focused_result.category_coverage)

        keyword_filter = st.text_input("🔎 Filter Keywords (optional):")
        filter_text = keyword_filter.lower()
        filtered_matched_items = [
            item
            for item in focused_result.matched
            if not filter_text or filter_text in item.display_term.lower()
        ]
        filtered_missing_items = [
            item
            for item in focused_result.missing
            if not filter_text or filter_text in item.display_term.lower()
        ]
        filtered_missing_items.sort(key=lambda item: -item.count)
        filtered_matched = [item.display_term for item in filtered_matched_items]
        filtered_missing = [item.display_term for item in filtered_missing_items]

        render_keyword_panels(filtered_matched, filtered_missing[:50])
        render_normalized_match_explanations(focused_result.explanations)
        categorized_terms = [
            (item.display_term, item in focused_result.matched)
            for item in focused_result.job_concepts
            if item.category is not ConceptCategory.UNCATEGORIZED
        ]
        render_visualizations(
            filtered_missing,
            {item.display_term: item.count for item in filtered_missing_items},
            set(filtered_matched),
            {item.display_term for item in focused_result.job_concepts},
            focused_skill_terms=categorized_terms,
        )
        render_pdf_download(
            {item.concept for item in focused_result.matched},
            filtered_missing,
            analysis_mode=analysis_mode,
            category_coverage=focused_result.category_coverage,
            explanations=focused_result.explanations,
            ordered_matched_keywords=filtered_matched,
        )

render_footer()
