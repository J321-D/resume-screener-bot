# Resume Screener Bot

A Streamlit application that compares the unique words in one or more resumes with
the unique words in a job description. It accepts PDF, DOCX, and TXT input, shows
matched and missing words, provides simple visualizations, and can export a PDF
report.

This commit captures the existing application as a behavioral baseline. The current
score is lexical overlap, not an assessment of candidate suitability, experience, or
job performance. Several UI sections are placeholders and are identified below.

## Current behavior

- Upload multiple resumes or paste resume text.
- Upload or paste one job description.
- Combine all resume words into one set.
- Preserve common punctuated and hyphenated technical terms during tokenization,
  including `C++`, `C#`, `.NET`, `Node.js`, and `machine-learning`.
- Calculate the percentage of unique job-description words also found in that set.
- Display matched and missing words.
- Render missing-word and skill-presence charts.
- Generate a PDF keyword report when the installed FPDF implementation is compatible.

The GPT toggle, template downloads, peer-review submission, and personalized coaching
sections are placeholders in the current baseline. They should not be treated as
implemented services.

## Requirements

- Python 3.10 or newer
- A local virtual environment is recommended

## Setup

```bash
git clone https://github.com/J321-D/resume-screener-bot.git
cd resume-screener-bot

python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Copy the example environment file if you plan to use future OpenAI-backed features:

```bash
cp .env.example .env
```

Then add your key locally. Never commit `.env` or an API key. The current baseline
does not use OpenAI or transmit resume content to it.

## Run

```bash
source .venv/bin/activate
streamlit run app.py
```

Streamlit will print a local URL. Open it in a browser and provide both resume and job
description text to view the current comparison results.

## Baseline verification

The baseline check uses only the Python standard library. It confirms that `app.py`
is byte-for-byte identical to the audited baseline and that its syntax parses:

```bash
python3 scripts/check_app.py
```

After installing dependencies, verify that every required import is available:

```bash
python3 scripts/check_app.py --check-dependencies
```

The SHA-256 lock is intentionally temporary. It protects the behavior-preserving
refactor baseline and will be replaced by characterization tests when the application
is modularized.

## Manual smoke test

1. Start the application with `streamlit run app.py`.
2. Paste `Python SQL` into the resume field.
3. Paste `Python SQL MATLAB` into the job-description field.
4. Confirm that the displayed match score is `66.7%`.
5. Confirm that `python` and `sql` are matched and `matlab` is missing.
6. Upload representative PDF, DOCX, and TXT files and confirm their text previews.
7. Exercise the filter and chart controls.

The `66.7%` expectation is a characterization of the current algorithm, not an
endorsement of that scoring model.

## Privacy and security

Resumes commonly contain personal information. Run the application locally, protect
your `.env` file, and do not transmit resume text to an external service without the
data owner's informed consent. The current baseline performs keyword matching locally.

## Project status

The application is undergoing an incremental, behavior-preserving refactor. Algorithm
changes will be reviewed separately and are not part of this baseline.
