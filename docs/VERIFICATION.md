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
pnpm audit --prod
```

Do not install or upgrade packages during routine verification.

## Browser and accessibility

- Complete both Skills-focused and Full lexical workflows.
- Verify uploads, manual text, input precedence, errors, and PDF download.
- Confirm stale results cannot be exported.
- Test keyboard navigation, labels, focus states, status announcements, and disclosures.
- Test reduced motion: animations are suppressed and final values render immediately.
- Review 1600, 1440, 1280, 1024, 820, 768, 430, 390, 360, and 320 px widths plus 200% zoom.
- Confirm no overflow, clipping, hidden controls, or unreadable contrast.
- Smoke-test the latest supported Chrome, Edge, Safari, and Firefox when the
  environment provides those engines. Record any unavailable browser as a coverage
  limitation rather than claiming it passed.

## Security and performance

- Confirm no secrets, credentials, résumé data, or other PII entered tracked files
  or command output intended for publication.
- Confirm the change adds no unsafe HTML, unnecessary persistence, or unapproved
  external data transmission, permissions, or telemetry. For approved analytics,
  verify the exact-origin and fixed-path allowlist, non-production suppression,
  query removal, and the absence of document/form content and custom events.
- Confirm dependency and lockfile changes are absent unless explicitly approved.
- Review rerenders, list bounds, network requests, and bundle impact for frontend
  changes; avoid duplicate parsing or score computation.
- Confirm error paths do not expose stack traces or document contents.
- Confirm analysis/report responses use `Cache-Control: no-store`, JSON/PDF
  content types are correct, unauthorized CORS origins are denied, and unsupported
  methods fail normally.
- Confirm Preview builds are noindex, Production remains canonical/indexable, and
  the sitemap lists only real public routes.
- Run `pnpm audit --prod`; distinguish `pip check` compatibility from a dedicated
  Python CVE audit and record when the latter tool is unavailable.

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

The current fresh inventory is **156 automated checks**: 101 Python tests, 39
frontend unit/accessibility tests, and 16 Playwright checks across desktop and
mobile projects. The historical public baseline was 126 checks; recalculate this
inventory whenever suites change rather than preserving a number for presentation
continuity.

## Browser lifecycle and repeated use

- Exercise analyze → review → export → New analysis at least three times with
  synthetic data; old result DOM, review state, timers, and object URLs must not
  accumulate.
- Check cancellation, retry, a second request after cancellation, editing after a
  result, background/foreground return, Back/Forward restoration, and unmount.
- Open two independent tabs with different synthetic inputs. No local/session
  storage or shared application state may transfer documents, results, review,
  errors, export, or demo state across tabs.
- Verify temporary download URLs are revoked and global keyboard listeners are
  removed when their component closes/unmounts.

For an already authorized deployed smoke only:

```bash
./venv/bin/python scripts/smoke_public.py
```

## Verification handoff

Before the single milestone report, review the integrated diff and map the approved
objective to direct evidence. State test counts, browser coverage, protected-file
status, limitations, and any checks that could not run. A successful subset must
not be presented as complete verification.
