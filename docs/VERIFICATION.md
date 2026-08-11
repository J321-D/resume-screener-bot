# Verification

Every milestone must pass this checklist before commit, tag, push, publication, or deployment. Record command output and investigate failures. Correct routine in-scope failures and rerun the affected checks; never conceal a failure by silently retrying or weakening a test.

Run verification as one milestone phase rather than an approval checkpoint after
each command. Report early only when a failure reaches a repository approval gate,
reveals a material architectural conflict, or cannot be resolved safely in scope.

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
- Smoke-test the latest supported Chrome, Edge, Safari, and Firefox when the
  environment provides those engines. Record any unavailable browser as a coverage
  limitation rather than claiming it passed.

## Security and performance

- Confirm no secrets, credentials, résumé data, or other PII entered tracked files
  or command output intended for publication.
- Confirm the change adds no unsafe HTML, unnecessary persistence, external data
  transmission, permissions, or telemetry.
- Confirm dependency and lockfile changes are absent unless explicitly approved.
- Review rerenders, list bounds, network requests, and bundle impact for frontend
  changes; avoid duplicate parsing or score computation.
- Confirm error paths do not expose stack traces or document contents.

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

Use explicit paths for staging. Never use unrestricted `git add .`.

## Screenshot review

Capture representative desktop and 390 px mobile states when UI changes. Review landing, workspace, fresh results, expanded lists, export, error states, and reduced motion where practical. Store release documentation screenshots only in `docs/images/`; keep temporary captures outside the repository.

## Release gate

No deployment proceeds unless every applicable item passes, protected diffs are authorized, documentation is current, repository status is understood, and the user explicitly approves the release operation.

## Public release-candidate deployment

Before committing deployment configuration or requesting another provider change:

- Confirm `.python-version`, `render.yaml`, `frontend/package.json`,
  `frontend/pnpm-lock.yaml`, and `frontend/pnpm-workspace.yaml` are tracked and
  internally consistent.
- Parse `render.yaml`; verify the entrypoint is `api.main:app`, the health path is
  `/api/v1/health`, and automatic deploys are off.
- Run the frontend frozen install and production build with Node 24 and pnpm
  11.16.0.
- Confirm the only required runtime values are the exact-origin
  `RESUME_SCREENER_ALLOWED_ORIGINS`, public build-time `NEXT_PUBLIC_API_URL`, and
  Vercel's non-secret `ENABLE_EXPERIMENTAL_COREPACK=1` build switch.
- Confirm `https://resume-keyword-screener.vercel.app` resolves publicly to the
  approved Production deployment, raw deployment and Preview URLs remain
  access-protected, Render allows only that exact public origin, and automatic
  Render deploys remain off.
- Recheck health, both analysis modes, uploads, review state, Markdown/PDF export,
  structured errors, provider-log privacy, and desktop/mobile overflow against
  the hosted public release candidate.
- Follow [DEPLOYMENT.md](DEPLOYMENT.md) for hosted smoke tests and rollback.

The current repository baseline comprises **121 checks**: 97 Python unittest
tests, 18 frontend unit/accessibility tests, and 6 Playwright tests. Update these
counts only when the corresponding suites change.

## Verification handoff

Before the single milestone report, review the integrated diff and map the approved
objective to direct evidence. State test counts, browser coverage, protected-file
status, limitations, and any checks that could not run. A successful subset must
not be presented as complete verification.
