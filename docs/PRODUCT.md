# Product

## Purpose

Resume Keyword Screener is a privacy-conscious, deterministic lexical analysis tool. It compares résumé content with a job description and explains which requested terms are represented, missing, or normalized through documented rules.

It does **not** measure candidate quality, predict applicant-tracking-system decisions, infer employability, or make hiring recommendations.

## Users

- Job seekers tailoring truthful résumé language to a role
- Career advisors reviewing lexical alignment with a client
- Recruiters or hiring teams performing a transparent terminology review
- Contributors studying deterministic résumé-analysis systems

## Problems solved

- Makes résumé-to-role vocabulary overlap visible.
- Preserves technical tokens such as `C++`, `C#`, `.NET`, and `Node.js`.
- Explains curated phrase and synonym normalization.
- Separates categorized skills coverage from uncategorized lexical terms.
- Produces a portable, Unicode-safe report without transmitting documents to an external AI service.

## Core workflow

1. Choose Skills-focused or Full lexical analysis.
2. Upload or paste résumé content and a job description.
3. Run the deterministic server-side comparison.
4. Review coverage, matched terms, opportunities, categories, and normalization explanations.
5. Download the server-generated PDF report when useful.
6. Clear the current session with New analysis before starting another document.

## Current capabilities

- Skills-focused analysis with deterministic stop words, longest-first phrases, curated synonyms, taxonomy categories, and an Uncategorized fallback
- Full lexical v1.0 compatibility mode
- PDF, DOCX, and UTF-8 TXT input with a 10 MB per-file limit
- Combined analysis of up to five résumés
- Explicit résumé and job-description input precedence
- Exact-token missing-term ranking with deterministic tie-breaking
- Unicode-safe PDF reports
- Streamlit compatibility interface
- FastAPI boundary and responsive Next.js interface
- Session-local opportunity review with status filters, search, progress, reset, and a Markdown action checklist
- A synthetic demonstration, responsive navigation, searchable Help, manual retry/cancel, stale-result protection, and explicit New analysis reset
- Copyable factual result summaries and explicitly selected opportunity terms
- Request-scoped processing without application persistence or external
  résumé-analysis services
- Anonymous aggregate Vercel page analytics limited to the fixed public routes;
  no document content, form input, filenames, query strings, or custom interaction
  events are collected by the application analytics integration

## Current limitations

- No OCR for image-only PDFs
- No semantic similarity, stemming, fuzzy matching, embeddings, or generative AI
- Curated normalization recognizes only documented concepts
- Review decisions reset on refresh or when analysis inputs become stale; there are no saved analyses, accounts, collaboration, or cross-candidate comparisons
- Coverage is lexical evidence, not evidence of competency or experience
- Curated analysis is English-first; Unicode remains safe but multilingual semantic understanding is not claimed

## Product boundary

The V2.x product includes the review workspace, searchable assistance,
demo/onboarding, resilience, bounded document handling, cross-browser responsive
presentation, and repository operations without changing the protected engine.
It is intentionally a deterministic lexical instrument, not an AI writer,
candidate-ranking system, coaching service, résumé template library, peer-review
network, or ATS predictor.

Persistence, accounts, collaboration, approximate source highlighting, OCR,
candidate comparison, and custom analytics have been evaluated and closed with
specific reasons in [ROADMAP.md](ROADMAP.md) and
[COMPLETENESS.md](COMPLETENESS.md); they are not silently deferred promises.
