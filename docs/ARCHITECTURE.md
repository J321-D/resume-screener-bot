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

![Runtime architecture](images/architecture.svg)

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

The API does not reimplement analysis rules. An ASGI boundary rejects declared or
streamed request bodies above 28 MB before multipart parsing. The document service
then bounds file count, individual and combined upload size, pasted/extracted text,
file signatures, and suspicious DOCX archive expansion. Larger bounded multipart
bodies may be spooled to request-scoped temporary storage by the framework and
are closed when the request completes. Analysis/report work runs off the event
loop, and every sensitive response—including public errors—uses
`Cache-Control: no-store`.

## Next.js client

`frontend/` uses the App Router and TypeScript contracts:

- `app/`: routes, metadata, and global visual system
- `components/analysis/`: inputs, upload controls, readiness, and progress
- `components/results/`: coverage, ordered findings, categories, explanations, and export
- `components/help/`: searchable, categorized, deep-linked assistance and glossary
- `components/shell/`: navigation and hero
- `components/analytics/`: production page-analytics mounting and the fixed-path
  privacy filter, with no custom events
- `lib/`: API client, runtime contract validation, and presentation formatting

The client owns presentation state only. Stale results remain visible but cannot be exported as if they represented changed inputs.
Request identity, AbortController cleanup, and submitted-input snapshots prevent
late requests from overwriting newer state. No document or result data is placed
in localStorage, sessionStorage, URLs, or server-rendered route payloads, so tabs
remain independent by default.

## Data flow

1. The client collects files, manual text, and analysis mode.
2. It sends multipart input to `/api/v1/analyze`.
3. The API validates size, type, count, and field constraints.
4. The engine parses content and applies the selected deterministic analysis mode.
5. The API returns ordered terms, coverage, categories, explanations, metadata, and warnings.
6. The client renders those values without recalculation or reordering.
7. PDF export sends the current inputs to `/api/v1/report`; the server recomputes and generates the report.

`/api/v1` is the stable transport contract. Product/UI Version 2 does not imply
an API v2; a new API version is reserved for an intentionally incompatible
request or response contract.

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
- Playwright: Chromium/Firefox desktop, WebKit mobile, workflow, accessibility
  preferences, and responsive behavior
- Manual screenshots: hierarchy, clipping, motion, and breakpoint quality

Mandatory commands are in [VERIFICATION.md](VERIFICATION.md). Architectural decisions are recorded in [DECISIONS.md](DECISIONS.md).

## Public hosting boundary

The public release topology hosts `frontend/` on Vercel at
`https://resume-keyword-screener.vercel.app` and `api.main:app` on Render. The
browser receives the Render API origin at build time; the API admits only the
exact public Vercel origin and the exact stable access-protected Preview origin
through `RESUME_SCREENER_ALLOWED_ORIGINS`. Deployment-specific and unrelated
origins are denied. Automatic Render deploys remain disabled. Vercel Preview and
raw deployment URLs remain access-protected, while the Streamlit v1.1.2
deployment remains an independent legacy interface and fallback.

The hosting boundary does not add application persistence. Documents are processed
for the current request; framework multipart handling may use bounded temporary
spooling and closes upload resources on completion. Application code does not log
document contents. Platform request metadata and provider retention remain
external privacy considerations that must be reviewed before real résumé data is
used. Exact settings and rollback steps are in [DEPLOYMENT.md](DEPLOYMENT.md).

The public frontend mounts Vercel Web Analytics in production only. Its
`beforeSend` filter accepts only the public production origin with `/`,
`/methodology`, or `/privacy`, strips query strings and fragments, and rejects
every other origin or path. The integration records
anonymous aggregate page traffic and deliberately defines no custom events; it
never receives multipart request bodies, document contents, filenames, extracted
terms, reports, or form input. Local development and tests use the package's
non-transmitting development mode with debug output disabled.

## Security and privacy boundaries

- Public surfaces: four static frontend routes, static assets, health, analysis,
  report, and intentionally public FastAPI OpenAPI documentation.
- Authentication/CSRF: the API is stateless and accepts no credential-bearing
  cookies, so traditional CSRF tokens are not applicable. CORS remains an exact
  origin browser boundary, not authentication.
- Documents: supported containers are read in memory; DOCX files are never
  extracted to filesystem paths and external relationships/macros are not
  executed or fetched. DOCM is unsupported.
- Resource controls: 28 MB whole request, 10 MB per file, 25 MB combined uploads,
  five résumés, 200,000 characters per pasted/extracted text, signature checks,
  DOCX archive bounds, a 45-second client timeout, slow-service notice, manual
  retry, and cancellation. A hard server CPU deadline for pathological native
  parsing requires process isolation and is intentionally not simulated with an
  unsafe thread timeout.
- Caching/indexing: sensitive API responses are `no-store`; public static content
  remains cacheable. Preview builds emit noindex controls while Production stays
  canonical and indexable.
- Observability: health proves process availability only. Synthetic smoke tests
  provide deeper behavior evidence without using private documents.
