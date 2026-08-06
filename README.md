# Resume Keyword Screener

🚀 **Live demo:** https://resume-keyword-screener.streamlit.app

Resume Keyword Screener v1.1.0 is a local, deterministic résumé-to-job-description
comparison tool built with Python and Streamlit. It measures lexical coverage; it
does not predict ATS decisions, candidate performance, or hiring outcomes.

## Features

- **Skills-focused analysis** is the default relevance-focused lexical mode.
- **Full lexical analysis** preserves the v1.0 tokenization, scoring, ranking,
  filtering, warning threshold, and combined-résumé behavior.
- Deterministic English stop-word filtering in skills-focused mode.
- Longest-first recognition of curated two- and three-word phrases.
- Curated synonym and abbreviation normalization with original display terms.
- Category coverage for technical skills, quality/regulatory terminology,
  tools/software, education, experience/action terms, and Uncategorized terms.
- Explicit **Uncategorized** fallback for unknown non-stop-word concepts.
- ATS-aware tokens including `C++`, `C#`, `.NET`, `Node.js`, and hyphenated terms.
- PDF, DOCX, and UTF-8 TXT uploads with a **10 MB per-file limit**.
- Unicode-safe PDF reports with mode, category, and normalized-match details.
- Responsive desktop and mobile Streamlit interface.
- Local-only document processing.

There is no AI, embedding model, fuzzy matching, stemming, OCR, or external résumé
transmission. The application does not require API credentials.

## Screenshots

These images are retained as general layout references and may predate the v1.1.0
analysis-mode controls.

### Desktop

![Desktop layout](docs/images/desktop.png)

### Mobile

![Mobile layout](docs/images/mobile.png)

## Analysis modes

### Skills-focused analysis

The default mode removes a small documented set of filler words, consumes supported
phrases longest-first, and maps only explicitly curated aliases. Examples include:

- `QC` ↔ quality control
- `QA` ↔ quality assurance
- `GMP` ↔ good manufacturing practice
- `DOE` ↔ design of experiments
- `CAPA` ↔ corrective and preventive action
- `SOP` ↔ standard operating procedure
- `EBR` ↔ electronic batch record
- `bioreactors` ↔ bioreactor

The first job-description surface form is used for deterministic display. Unknown
meaningful terms are retained as Uncategorized. Empty categories display
`N/A — no applicable concepts` rather than a misleading zero-percent result.

### Full lexical analysis

This compatibility mode preserves v1.0 behavior. For example:

- Résumé: `Python SQL`
- Job description: `Python SQL MATLAB`
- Keyword coverage: **66.7%**

It retains existing unique-token scoring, one-decimal rounding, exact missing-term
frequency ranking, first-occurrence tie-breaking, substring filtering, strict
below-30% warning behavior, and multiple-résumé union behavior.

## Upload support and limitations

- Supported types: PDF, DOCX, and UTF-8 TXT.
- Maximum size: **10 MB per uploaded file**.
- Password-protected, malformed, unsupported, unreadable, and empty files receive
  concise user-facing errors.
- Image-only PDFs remain unsupported because OCR is not included.
- Manual résumé text is additive to uploaded résumés.
- Manual job-description text replaces an uploaded job description.

## Unicode PDF reports

PDF reports use Droid Sans Fallback supplied by PyMuPDF/MuPDF. Accented Latin,
Chinese, Japanese, and Korean text is supported without a system-font installation.
Unsupported glyphs are replaced with `?` instead of failing report generation.
Droid Sans Fallback is an Android font licensed under Apache License 2.0.

## Requirements and setup

- Python 3.9 or newer
- A virtual environment is recommended

```bash
git clone https://github.com/J321-D/resume-screener-bot.git
cd resume-screener-bot
python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Run the application:

```bash
streamlit run app.py
```

## Verification

The project contains **72 deterministic unittest tests**.

```bash
MPLCONFIGDIR=/private/tmp/resume-screener-matplotlib-tests \
python -m unittest discover -s tests -v

python scripts/check_app.py
python -m pip check
git diff --check
python -m compileall app.py resume_screener
python -c "import app"
```

## Manual smoke test

1. Launch `streamlit run app.py`.
2. Confirm **Skills-focused analysis** is selected by default.
3. Paste `QC Python` as résumé text and `quality control Python SQL` as the job
   description.
4. Confirm category coverage and a normalized `QC` explanation appear.
5. Generate and download the PDF report.
6. Switch to **Full lexical analysis**.
7. Paste `Python SQL` and `Python SQL MATLAB`.
8. Confirm coverage is exactly **66.7%**, with `python` and `sql` matched and
   `matlab` missing.
9. At 390 px width, confirm the inputs stack and no text or controls are clipped.

## Privacy

- Résumé and job-description analysis runs locally in the application process.
- Documents are not sent to external APIs.
- Uploaded content is not intentionally persisted by the application.
- Never commit `.env` files, credentials, or résumé data.

## Project status

**v1.1.0** provides deterministic skills-focused analysis while retaining the full
v1.0 lexical compatibility mode. It includes robust document parsing, category
coverage, curated phrase and synonym matching, Unicode-safe reports, responsive UI,
and 72 automated tests.
