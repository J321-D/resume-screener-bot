# Architecture

## Overview

```text
Browser                 Compatibility UI
Next.js                 Streamlit (`app.py`)
   │ multipart HTTP          │
   ▼                         │
FastAPI (`api/`)             │
   │ typed orchestration     │
   └──────────────┬──────────┘
                  ▼
       Python engine (`resume_screener/`)
       parse → normalize → match → score → rank
                  │
                  ▼
          Unicode PDF report
```

## Python engine

`resume_screener/` is the source of truth for deterministic behavior:

- `analysis.py`: lexical tokenization, aggregation, matching, scoring, and missing-term ranking
- `parsing.py`: PDF, DOCX, and TXT validation and extraction
- `models.py`: shared internal data structures and analysis modes
- `normalization/`: stop words, curated phrases, synonyms, and concept matching
- `scoring/`: category and focused-coverage calculations
- `skills/`: taxonomy, focused matching, and chart selection
- `reporting.py`: Unicode-safe PDF construction

These modules are protected because small changes can alter scores, ordering, compatibility, or reports.

## FastAPI boundary

`api/` exposes versioned HTTP routes for health, analysis, and reporting. Pydantic models in `api/schemas.py` define the public contract. Services validate transport inputs, invoke the existing engine, and map results into ordered responses. Public exceptions are concise and do not expose stack traces or document contents.

The API does not reimplement analysis rules.

## Next.js client

`frontend/` uses the App Router and TypeScript contracts:

- `app/`: routes, metadata, and global visual system
- `components/analysis/`: inputs, upload controls, readiness, and progress
- `components/results/`: coverage, ordered findings, categories, explanations, and export
- `components/shell/`: navigation and hero
- `lib/`: API client, runtime contract validation, and presentation formatting

The client owns presentation state only. Stale results remain visible but cannot be exported as if they represented changed inputs.

## Data flow

1. The client collects files, manual text, and analysis mode.
2. It sends multipart input to `/api/v1/analyze`.
3. The API validates size, type, count, and field constraints.
4. The engine parses content and applies the selected deterministic analysis mode.
5. The API returns ordered terms, coverage, categories, explanations, metadata, and warnings.
6. The client renders those values without recalculation or reordering.
7. PDF export sends the current input signature to `/api/v1/reports`; the server recomputes and generates the report.

## Why scoring stays server-side

One authoritative implementation prevents Python/TypeScript drift, preserves v1.0 compatibility, and keeps contract tests meaningful. The browser must never calculate, reinterpret, or label scores as candidate quality.

## Combined résumé behavior

Multiple uploaded résumés and optional manual résumé text form one union for a single lexical comparison. This supports multi-document career histories while preventing duplicate terms from inflating unique-concept coverage. Manual job-description text takes precedence over an uploaded job description. Both behaviors are compatibility contracts.

## PDF generation

The server reuses analysis output and the protected reporting engine. Reports preserve ordered sections and term lists, support Unicode through a dependency-provided licensed font, and return PDF bytes. The browser only initiates and downloads the response.

## Testing layers

- Python unit and characterization tests: engine rules, parsing, reports, models, and Streamlit behavior
- API contract tests: schemas, validation, errors, precedence, aggregation, and report bytes
- Frontend unit tests: components, accessibility, runtime contracts, state, and stale protection
- Playwright: desktop/mobile workflow and responsive behavior
- Manual screenshots: hierarchy, clipping, motion, and breakpoint quality

Mandatory commands are in [VERIFICATION.md](VERIFICATION.md). Architectural decisions are recorded in [DECISIONS.md](DECISIONS.md).

## Public hosting boundary

The public release-candidate topology hosts `frontend/` on Vercel at
`https://resume-keyword-screener.vercel.app` and `api.main:app` on Render. The
browser receives the Render API origin at build time; the API admits only the
exact public Vercel origin through `RESUME_SCREENER_ALLOWED_ORIGINS`. Automatic
Render deploys remain disabled. Vercel Preview and raw deployment URLs remain
access-protected, while the Streamlit v1.1.2 deployment remains an independent
legacy interface and rollback option.

The hosting boundary does not add persistence. Documents are processed in memory
and application code does not log their contents. Platform request metadata and
provider retention remain external privacy considerations that must be reviewed
before real résumé data is used. Exact settings and rollback steps are in
[DEPLOYMENT.md](DEPLOYMENT.md).
