# Product

## Purpose

Resume Keyword Screener is a private, deterministic lexical analysis tool. It compares résumé content with a job description and explains which requested terms are represented, missing, or normalized through documented rules.

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
3. Run the private server-side comparison.
4. Review coverage, matched terms, opportunities, categories, and normalization explanations.
5. Download the server-generated PDF report when useful.

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
- Local processing without document persistence or external résumé transmission

## Current limitations

- No OCR for image-only PDFs
- No semantic similarity, stemming, fuzzy matching, embeddings, or generative AI
- Curated normalization recognizes only documented concepts
- Review decisions reset on refresh or when analysis inputs become stale; there are no saved analyses, accounts, collaboration, or cross-candidate comparisons
- Coverage is lexical evidence, not evidence of competency or experience

## Future vision

Version 2.1 will improve review ergonomics without changing the engine. Later releases may add saved comparisons, recruiter workflows, and carefully bounded AI-assisted rewriting. Persistence, authentication, collaboration, AI, and plugins remain approval-gated architectural changes. See [ROADMAP.md](ROADMAP.md).
