# Resume Keyword Screener

🚀 **Live Demo:** https://resume-keyword-screener.streamlit.app

Resume Keyword Screener is an ATS-style résumé keyword analysis tool that compares one or more résumés with a job description to measure deterministic lexical keyword coverage.

It supports PDF, DOCX, and TXT uploads, ATS-aware technical tokenization, phrase and synonym normalization, category-level coverage, interactive visualizations, and Unicode-safe PDF report generation.

The reported scores measure **lexical overlap only**. They are **not** assessments of candidate quality, experience, job performance, hiring suitability, or the behavior of a specific applicant-tracking system.

The published v1.1.2 release uses the stable Streamlit interface. An additive,
local Version 2 interface pairs a responsive Next.js client with a narrow FastAPI
boundary over the same deterministic Python engine. Version 2 remains unreleased
and has not been published or deployed.

---

## Features

- 📄 PDF, DOCX, and UTF-8 TXT parsing
- 🎯 ATS-aware technical-term tokenization
- 📊 Skills-focused and v1.0-compatible Full lexical analysis modes
- 🧩 Longest-first phrase recognition
- 🔁 Curated synonym and abbreviation normalization
- 🗂️ Category-level skill coverage
- 📈 Matched and missing keyword visualizations
- 📑 Unicode-safe PDF report generation
- 📱 Responsive desktop and mobile interface
- 🔒 No external AI or résumé-analysis API calls
- ✅ Robust upload validation and user-friendly errors
- 🧪 84 automated unittest tests

### Local Version 2 additions

- Responsive Next.js client over the FastAPI application boundary.
- Session-local review of every coverage opportunity using **Add to résumé**,
  **Already represented**, **Not relevant**, and **Review later** statuses.
- Reviewed/remaining progress, factual status totals, filters, and term search.
- Ordered Markdown checklist export for opportunities marked Add to résumé.
- Automatic decision clearing when changed inputs make the current analysis stale.

---

## Screenshots

### Desktop

[![Desktop](docs/images/desktop.png)](docs/images/desktop.png)

### Mobile

[![Mobile](docs/images/mobile.png)](docs/images/mobile.png)

> The screenshots demonstrate the responsive application interface. Some v1.1.2 analysis controls and result visualizations appear below the initially visible input area.

---

## Analysis modes

### Skills-focused analysis

Skills-focused analysis is the default mode. It provides a cleaner relevance-focused comparison by:

- removing a deterministic set of filler words and generic job-posting language
- removing possessive suffixes such as `'s` and `’s`
- recognizing supported two- and three-word phrases longest-first
- preventing recognized phrase components from being counted again from the same text span
- normalizing only explicitly curated synonyms and abbreviations
- preserving original résumé and job-description terms for display
- grouping recognized concepts into curated categories
- retaining unknown meaningful concepts as **Uncategorized**
- explaining normalized matches
- rendering a horizontal matched-versus-missing categorized skills chart

Examples of supported normalization include:

- `QC` → `quality control`
- `QA` → `quality assurance`
- `GMP` → `good manufacturing practice`
- `DOE` → `design of experiments`
- `CAPA` → `corrective and preventive action`
- `SOP` → `standard operating procedure`
- `EBR` → `electronic batch record`
- `bioreactors` → `bioreactor`
- `cell-culture` → `cell culture`

Normalization is intentionally narrow and deterministic. The application does not use stemming, fuzzy matching, embeddings, generative AI, or external analysis APIs.

### Full lexical analysis

Full lexical analysis preserves the v1.0 comparison behavior, including:

- unique-token lexical scoring
- one-decimal score rounding
- strict warning behavior below 30%
- multiple-résumé union behavior
- ATS-aware technical tokenization
- exact missing-keyword frequency ranking
- stable first-appearance tie-breaking
- substring keyword filtering
- existing upload and pasted-text precedence
- legacy filler-word and possessive-token behavior

This mode remains available for backward compatibility and direct lexical inspection.

---

## Coverage calculation

### Skills-focused categorized coverage

The primary Skills-focused score is calculated from categorized job-description concepts only:

```text
categorized matched concepts
──────────────────────────── × 100
categorized JD concepts
```

Uncategorized terms do not affect the primary categorized score.

They remain visible in the matched and missing details and receive their own secondary metric:

```text
Uncategorized lexical coverage
```

If the job description contains no categorized concepts, the primary result displays:

```text
N/A — no categorized concepts
```

A category containing no applicable job-description concepts displays:

```text
N/A — no applicable concepts
```

### Full lexical coverage

Full lexical coverage is calculated as:

```text
matched unique JD tokens
──────────────────────── × 100
all unique JD tokens
```

---

## Coverage categories

Skills-focused mode reports:

- Technical skills
- Quality/regulatory
- Tools/software
- Education
- Experience/action terms
- Uncategorized

The taxonomy is curated rather than universal. Unknown meaningful terms remain visible under **Uncategorized** instead of being silently discarded.

---

## Core functionality

- Upload one or more résumés, paste résumé text, or use both.
- Upload or paste one job description.
- Combine all supplied résumés into one comparison set.
- Preserve technical terms such as `C++`, `C#`, `.NET`, `Node.js`, `cell-culture`, `machine-learning`, and `real-time`.
- Calculate deterministic lexical coverage.
- Display matched and missing terms.
- Rank missing terms by frequency with stable job-description ordering.
- Explain curated phrase, synonym, abbreviation, and singular/plural matches.
- Show category-level coverage.
- Display a horizontal categorized chart showing matched and missing concepts.
- Display a separate missing-keyword frequency chart.
- Filter visible matched and missing terms.
- Generate a Unicode-safe PDF report for either analysis mode.

Multiple uploaded résumés are currently combined into one lexical comparison rather than scored independently.

---

## Upload support and limitations

- Supported formats are PDF, DOCX, and UTF-8 TXT.
- Maximum file size is **10 MB per file**.
- Password-protected, malformed, unsupported, unreadable, and empty files are rejected with concise messages.
- Invalid UTF-8 TXT files are rejected.
- Image-only PDFs are detected when they contain no extractable text.
- OCR is **not** included.
- Scanned documents must be converted to searchable PDFs before upload.
- Unknown MIME types do not silently fall through to TXT parsing.

PDF reports use **Droid Sans Fallback**, supplied through PyMuPDF/MuPDF. It supports accented Latin, Chinese, Japanese, and Korean text without requiring a system font installation.

Characters unavailable in the font are replaced with `?` instead of causing report generation to fail. Complex right-to-left shaping is not explicitly supported.

---

## Requirements

- Python 3.9 or newer
- A local virtual environment is recommended

The application is tested in both Python 3.9 and Python 3.12 environments.

---

## Setup

```bash
git clone https://github.com/J321-D/resume-screener-bot.git
cd resume-screener-bot

python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

The application does not require an API key.

An example environment file remains available for possible future integrations:

```bash
cp .env.example .env
```

Never commit `.env` files or credentials to Git.

---

## Run

```bash
source .venv/bin/activate
streamlit run app.py
```

Streamlit will display a local URL. Open it in a browser, provide résumé content and a job description, choose an analysis mode, and review the results.

---

## Version 2 development interface

Version 2 is additive: it does not replace or reimplement the Python engine. Run
the API and frontend in separate terminals:

```bash
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000
```

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Copy `frontend/.env.example` to `frontend/.env.local` only when the API is not at
the default `http://localhost:8000`. The API permits local development origins by
default; production origins must be supplied explicitly through its environment.
The client never performs scoring or normalization—it submits validated inputs to
the API and renders the returned ordered contract.

## Project documentation

- [Repository operating manual](AGENTS.md)
- [Product definition](docs/PRODUCT.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Verification checklist](docs/VERIFICATION.md)
- [Architectural decisions](docs/DECISIONS.md)
- [Changelog](docs/CHANGELOG.md)
- [Contributing guide](docs/CONTRIBUTING.md)

### Version 2 architecture

```text
frontend/                  Next.js application and browser-facing tests
  app/                     Routes, metadata, and global design system
  components/              Workspace, upload, progress, and result views
  lib/                     Typed API contract and presentation helpers
api/                       FastAPI transport boundary
  routes/                  Health, analysis, and report endpoints
  services/                Upload validation and engine orchestration
resume_screener/           Established deterministic analysis and PDF engine
tests/                     Python engine and API contract tests
```

Production deployments should set `NEXT_PUBLIC_API_URL` to the public HTTPS API
origin and `RESUME_SCREENER_ALLOWED_ORIGINS` to the exact frontend origin. The
frontend is compatible with standard Next.js hosts; the API requires a Python host
that starts `uvicorn api.main:app --host 0.0.0.0 --port $PORT`. No deployment is
performed by this repository configuration.

---

## Verification

Run the application integrity and syntax check:

```bash
python3 scripts/check_app.py
```

Verify required imports and dependencies:

```bash
python3 scripts/check_app.py --check-dependencies
```

Run the complete automated test suite:

```bash
MPLCONFIGDIR=/private/tmp/resume-screener-tests \
python -m unittest discover -s tests -v
```

The v1.1.2 release includes **84 automated unittest tests** covering analysis, normalization, scoring, parsing, reporting, models, chart preparation, responsive styles, application behavior, and Python import compatibility.

### Version 2 verification

The locally complete Version 2 milestone contains **97 deterministic Python
unittest tests**, **17 frontend unit, interaction, formatting, and accessibility
tests**, and **6 Playwright desktop/mobile checks**: **120 checks total**.

```bash
MPLCONFIGDIR=/private/tmp/resume-screener-matplotlib-tests \
python -m unittest discover -s tests -v

python scripts/check_app.py
python -m pip check
git diff --check
python -m compileall app.py api resume_screener
python -c "import app; import api.main"

cd frontend
pnpm check
pnpm test:e2e
```

---

## Manual smoke test

### Full lexical compatibility

1. Start the application:

```bash
streamlit run app.py
```

2. Select **Full lexical analysis**.
3. Paste the following résumé text:

```text
Python SQL
```

4. Paste the following job description:

```text
Python SQL MATLAB
```

5. Confirm:

- coverage is **66.7%**
- `python` and `sql` are matched
- `matlab` is missing

### Skills-focused analysis

1. Select **Skills-focused analysis**.
2. Paste résumé content containing:

```text
QC GMP SOP C++ Node.js cell-culture technical writing
```

3. Paste job-description content containing:

```text
Quality Control
Good Manufacturing Practice
Standard Operating Procedures
C++
Node.js
Cell culture
Technical writing
Process validation
```

4. Confirm:

- normalized-match explanations appear
- phrase components are not listed separately
- category coverage appears
- Uncategorized coverage appears separately
- filler words do not dominate the results
- the categorized chart clearly distinguishes matched and missing concepts
- technical punctuation remains intact

### File and report handling

Upload representative PDF, DOCX, and UTF-8 TXT files and confirm:

- text previews are readable
- malformed files display friendly errors
- image-only PDFs display the OCR limitation message
- PDF reports download and open successfully
- report values match the visible interface

---

## Privacy and security

Résumés often contain sensitive personal information.

- When run locally, document processing occurs in the local application process.
- In the hosted demo, document processing occurs within the Streamlit application runtime.
- Résumé content is not sent to an external AI, embedding, or résumé-analysis API.
- Uploaded content is not intentionally persisted by the application.
- Protect `.env` files and credentials.
- Obtain appropriate permission before processing another person's résumé.

---

## Current limitations

- Multiple résumés are combined rather than scored independently.
- The taxonomy and synonym map are curated, not comprehensive.
- Unknown meaningful concepts may appear under **Uncategorized**.
- Skills-focused mode performs deterministic lexical matching, not semantic understanding.
- Full lexical mode intentionally includes ordinary filler words.
- OCR is unavailable for scanned PDFs.
- Unsupported PDF glyphs may render as `?`.
- Complex right-to-left shaping is not explicitly supported.
- The tool does not predict ATS decisions or hiring outcomes.

---

## Project status

**Resume Keyword Screener v1.1.2** is a stable portfolio release.

The current release includes:

- PDF, DOCX, and TXT parsing
- ATS-aware technical tokenization
- two analysis modes
- phrase-component suppression
- possessive cleanup in Skills-focused mode
- curated phrase and synonym normalization
- categorized primary coverage
- separate Uncategorized lexical coverage
- normalized-match explanations
- improved categorized matched/missing charting
- Unicode-safe PDF reports
- Python 3.9 deployment compatibility
- responsive desktop and mobile layouts
- robust upload validation
- 84 automated unittest tests

Version 2.0 is complete locally, including the additive FastAPI boundary, Next.js
frontend, premium responsive interface, and repository operating documentation.
It remains unpublished and undeployed. The current repository-level verification
count is **120 checks**: 97 Python tests, 17 frontend unit/accessibility tests, and
6 Playwright tests.

Future work may include independent candidate comparison, weighted requirements,
semantic matching, richer exports, OCR, project history, accessibility
improvements, authentication, or optional AI-assisted features.
