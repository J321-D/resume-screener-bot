# Verification

Every milestone must pass this checklist before commit, tag, push, publication, or deployment. Record command output and investigate failures; do not retry silently until green.

## Python and API

From the repository root:

```bash
MPLCONFIGDIR=/private/tmp/resume-screener-matplotlib-tests \
./venv/bin/python -m unittest discover -s tests -v

./venv/bin/python scripts/check_app.py
./venv/bin/python -m pip check
./venv/bin/python -m compileall app.py api resume_screener
./venv/bin/python -c "import app; import api.main"
```

Confirm successful parsing, both analysis modes, API error contracts, aggregation, input precedence, report generation, and the exact Full lexical compatibility example where `Python SQL` versus `Python SQL MATLAB` equals `66.7%`.

## Frontend

From `frontend/` using the locked pnpm version:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Do not install or upgrade packages during routine verification.

## Browser and accessibility

- Complete both Skills-focused and Full lexical workflows.
- Verify uploads, manual text, input precedence, errors, and PDF download.
- Confirm stale results cannot be exported.
- Test keyboard navigation, labels, focus states, status announcements, and disclosures.
- Test reduced motion: animations are suppressed and final values render immediately.
- Review 1600, 1440, 1280, 1024, 820, 768, 430, 390, and 360 px widths.
- Confirm no overflow, clipping, hidden controls, or unreadable contrast.

## Repository integrity

```bash
git diff --check
git status --short
git diff --exit-code -- \
  resume_screener/analysis.py \
  resume_screener/models.py \
  resume_screener/parsing.py \
  resume_screener/reporting.py \
  resume_screener/normalization \
  resume_screener/scoring \
  resume_screener/skills
```

Review the staged file list before every commit. Exclude `.env`, résumés, `node_modules`, `.next`, Playwright output, caches, temporary screenshots, and nested repositories. Confirm lockfiles change only with approved dependency work.

## Screenshot review

Capture representative desktop and 390 px mobile states when UI changes. Review landing, workspace, fresh results, expanded lists, export, error states, and reduced motion where practical. Store release documentation screenshots only in `docs/images/`; keep temporary captures outside the repository.

## Release gate

No deployment proceeds unless every applicable item passes, protected diffs are authorized, documentation is current, repository status is understood, and the user explicitly approves the release operation.
