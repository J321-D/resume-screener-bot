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
- An original analysis-core hero, truthful three-stage request timeline, category/term focus, exact-versus-normalized evidence labels, command palette, and keyboard review shortcuts
- State-fed résumé/role circuitry and an accessible deterministic category coverage matrix that cross-filters the existing evidence and review views
- A deterministic result fingerprint, paired résumé/role category blueprint, and session-only Overview/Standard/Dense result presentation
- An ordered Gap Mode, factual review Mission Board, resolved-item advancement, and session-only finding annotations
- A guided result walkthrough/system map, screen-only Living Report, Showcase Mode, Precision Lab light mode, and optional local-only performance HUD
- A bounded CSS/Canvas analysis-core field and exploded methodology view that explain state and architecture without inventing analysis data
- Ephemeral Presentation Mode, an explicit Cinematic Demo entry point, continuous analysis-state layout choreography, and interactive Methodology/Privacy system maps
- Copyable factual result summaries and explicitly selected opportunity terms
- Request-scoped processing without application persistence or external
  résumé-analysis services
- Anonymous aggregate Vercel page analytics limited to the fixed public routes;
  no document content, form input, filenames, query strings, or custom interaction
  events are collected by the application analytics integration
- An additive, privacy-bounded `/api/v2/analyze` evidence contract with exact
  matched-term offsets, deterministic finding identity, and explicit unknowns
- An Evidence Explorer with status/category/source/method/review filters, a
  deterministic TRACE chain, provenance inspector, and Machine View derived
  only from authoritative Contract v2 fields
- Exact Resume and Job Description X-Ray with selectable canonical parser text,
  represented-evidence overlays, scanner controls, source switching, keyboard
  navigation, and synchronized TRACE selection
- Conservative semantic sections with exact canonical ranges, section-aware
  X-Ray disassembly, and explicit unknown states for ambiguous structure
- Factual request diagnostics for extraction, section availability/repetition,
  the strict 30% boundary, and returned lexical opportunities
- A bounded Resume Lab for up to three résumé variants and five successful
  in-memory runs against one job description, with a run timeline, authoritative
  matrix, before/after Diff Reactor, per-run review state, and screen-only
  comparison record
- A Temporary Revision Workspace that edits only a current-memory text copy,
  submits only after Run Revision, labels the run source truthfully, and compares
  the successful result against the selected Resume Lab baseline

## Current limitations

- No OCR for image-only PDFs
- No semantic similarity, stemming, fuzzy matching, embeddings, or generative AI
- Curated normalization recognizes only documented concepts
- Review decisions, Resume Lab runs, and temporary revision text reset on refresh or explicit session
  clearing; decisions remain per-run and never propagate automatically. There
  are no saved analyses, accounts, collaboration, or candidate ranking.
- Focus mode narrows returned categories and terms; Contract v2 and X-Ray provide
  exact canonical documents, matched-term offsets, and conservative semantic
  sections, but not requirement severity, hiring confidence, or résumé-format
  readiness checks
- Independent candidate comparison and readiness/severity diagnostics remain unavailable;
  Resume Lab compares only the same user's bounded résumé
  variants against one role and does not simulate unsupported facts
- X-Ray's full canonical-text disclosure is explicit and request-scoped;
  semantic sections are English-first and appear only when a conservative
  parser-backed or standalone known heading maps exactly to canonical text
- Visual formatting quality, contact readiness, requirement severity, and
  candidate readiness remain unavailable rather than inferred
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
candidate ranking, and custom analytics have been evaluated and closed with
specific reasons in [ROADMAP.md](ROADMAP.md) and
[COMPLETENESS.md](COMPLETENESS.md); they are not silently deferred promises.
