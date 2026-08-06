# Repository Operating Manual

## Mission

Resume Keyword Screener provides private, deterministic lexical comparison between résumé content and a job description. It helps users see represented language and coverage opportunities; it does not assess candidate quality, predict an ATS outcome, or make hiring recommendations. Product intent lives in [docs/PRODUCT.md](docs/PRODUCT.md).

## System boundaries

- `resume_screener/` is the canonical Python analysis and PDF engine.
- `api/` is a narrow FastAPI transport and orchestration boundary.
- `frontend/` is the Next.js presentation client. It renders server results and never calculates scores.
- `app.py` and the Streamlit presentation modules remain the stable compatibility interface.
- `tests/` and `frontend/tests/` protect engine, API, UI, and browser behavior.

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing a boundary.

## Protected components

Do not change these without explicit approval:

- `resume_screener/analysis.py`
- `resume_screener/models.py`
- `resume_screener/parsing.py`
- `resume_screener/reporting.py`
- `resume_screener/normalization/`
- `resume_screener/scoring/`
- `resume_screener/skills/`
- public request/response behavior in `api/schemas.py`
- score calculation, rounding, warning thresholds, ordering, ranking, taxonomy, normalization, upload precedence, combined-résumé behavior, or PDF semantics

Characterization tests define compatibility but do not independently authorize behavioral changes.

## Development philosophy

1. Preserve observable behavior unless the milestone explicitly changes it.
2. Prefer deterministic, explainable behavior over opaque heuristics.
3. Keep scoring and document processing server-side.
4. Make the smallest coherent change; avoid speculative infrastructure.
5. Treat privacy, accessibility, and reproducibility as product requirements.
6. Use tests as evidence, not as permission to weaken a contract.
7. Keep documentation synchronized with released behavior.

## Architecture rules

- The browser submits inputs and renders the ordered API response.
- The API validates transport concerns, maps public errors, and delegates to the engine.
- The engine owns parsing, normalization, matching, scoring, ranking, category coverage, and report construction.
- Do not duplicate Python engine rules in TypeScript.
- Keep API contracts explicit, versioned, and backward compatible unless a change is approved.
- Do not introduce persistence, authentication, remote AI, analytics, or external document transmission by implication.

## Frontend standards

- Follow [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).
- Keep components presentation-focused and contracts typed.
- Preserve engine-provided order and values.
- Prefer semantic HTML, native controls, stable selectors, and progressive disclosure.
- Avoid fabricated rankings, subjective fit labels, fake processing delays, or claims about hiring suitability.
- Use existing CSS, SVG, and Framer Motion before considering another runtime dependency.

## Backend standards

- Keep endpoints thin and deterministic.
- Validate uploads before parsing and expose concise public errors without stack traces.
- Do not log or persist résumé or job-description contents.
- Maintain the 10 MB per-file limit and existing input precedence unless approved.
- Keep PDF generation server-side and Unicode-safe.

## Accessibility, responsive, and motion rules

- Every control needs an accessible name, keyboard operation, visible focus, and non-color state cue.
- Status changes must be understandable by assistive technology.
- Disclosures require `aria-expanded` and `aria-controls`.
- Respect `prefers-reduced-motion`; final values and all functionality must remain available without animation.
- Verify 1600, 1440, 1280, 1024, 820, 768, 430, 390, and 360 px widths.
- No horizontal overflow, clipped controls, or unreadable text is acceptable.

## Performance rules

- Do not add large client dependencies for effects available through CSS, SVG, or existing libraries.
- Avoid unnecessary client components, repeated parsing, duplicate requests, and client-side score recomputation.
- Keep result rendering bounded through accessible progressive disclosure.
- No new dependency is allowed without approval and a documented reason.

## Repository conventions

- Python: snake_case, typed public structures, deterministic functions, `unittest` test discovery.
- TypeScript: strict contracts, kebab-case component filenames, colocated presentation logic, Vitest and Playwright tests.
- Use `pnpm`; commit `frontend/pnpm-lock.yaml` when dependencies intentionally change.
- Never commit `.env`, résumé data, caches, build outputs, Playwright artifacts, screenshots outside `docs/images/`, or dependency directories.
- Ignore the untracked nested `resume-screener-bot/` repository unless a user explicitly places it in scope.
- Use scoped, imperative commit messages. Keep unrelated changes in separate commits.

## Autonomous work and approval gates

Agents may autonomously inspect, edit approved repository files, add relevant tests, run local checks, start local development servers, and capture temporary screenshots when those actions stay within the approved milestone.

Approval is required before:

- committing, pushing, tagging, publishing, or deploying;
- changing a protected component or established algorithm;
- adding, removing, or upgrading dependencies;
- destructive operations or deleting user-owned files;
- introducing a database, persistence, authentication, cloud service, external API, telemetry, or secrets;
- materially changing architecture, public contracts, privacy behavior, or product scope.

Stop when approval is required, a protected behavior would need to change, verification exposes an architectural conflict, credentials are needed, or the requested outcome cannot be achieved safely within scope.

## Milestone workflow

1. Inspect the repository, status, applicable instructions, contracts, and tests.
2. Implement the smallest approved coherent change.
3. Run targeted tests.
4. Self-review behavior, accessibility, security, performance, and diff scope.
5. Run the independent checklist in [docs/VERIFICATION.md](docs/VERIFICATION.md).
6. Fix in-scope issues without weakening tests.
7. Repeat verification until clean.
8. Update [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/CHANGELOG.md](docs/CHANGELOG.md) when milestone status changes.
9. Stop at the approval gate and report changed files, evidence, risks, and proposed next action.

Do not begin the next milestone merely because the current one passes.
