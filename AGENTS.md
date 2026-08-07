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

## Working relationship

The user acts as Product Owner: they set product intent, approve milestone scope,
and retain authority over high-risk or irreversible decisions. Codex acts as
Engineering Lead: it inspects the existing system, selects the smallest complete
implementation, coordinates routine work, verifies the integrated result, and
reports once the approved milestone is complete.

An approved milestone authorizes ordinary in-repository implementation and
verification. It does not authorize a protected change or any action listed in
the approval gates below.

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
- Prefer lightweight state, minimal rerenders, bounded rendering, and lazy loading when it measurably reduces cost without obscuring behavior.
- Keep result rendering bounded through accessible progressive disclosure.
- No new dependency is allowed without approval and a documented reason.

## Minimal diff policy

Extend the existing architecture before creating a parallel implementation. Avoid
unrelated cleanup, opportunistic refactors, stylistic rewrites, unnecessary file
movement, and abstractions without a current use. A milestone diff should contain
the smallest complete solution and its direct tests and documentation.

## Repository conventions

- Python: snake_case, typed public structures, deterministic functions, `unittest` test discovery.
- TypeScript: strict contracts, kebab-case component filenames, colocated presentation logic, Vitest and Playwright tests.
- Use `pnpm`; commit `frontend/pnpm-lock.yaml` when dependencies intentionally change.
- Never commit `.env`, résumé data, caches, build outputs, Playwright artifacts, screenshots outside `docs/images/`, or dependency directories.
- Ignore the untracked nested `resume-screener-bot/` repository unless a user explicitly places it in scope.
- Use scoped, imperative commit messages. Keep unrelated changes in separate commits.

## Autonomous work and approval gates

Agents may autonomously inspect, edit approved repository files, add relevant tests, run local checks, start local development servers, and capture temporary screenshots when those actions stay within the approved milestone.

Complete an approved milestone as one coherent engineering loop. Do not pause for
separate approval after file batches, CSS changes, component creation,
documentation updates, local servers, screenshots, linting, type checking, unit
tests, builds, Playwright runs, accessibility fixes, responsive fixes, or routine
verification failures. Diagnose in-scope failures, make the smallest correction,
retest, and continue. Report early only when a stop condition is reached.

Approval is required before:

- committing, pushing, tagging, publishing, or deploying;
- changing a protected component or established algorithm;
- adding, removing, or upgrading dependencies;
- destructive operations or deleting user-owned files;
- modifying outside the repository or merging branches;
- introducing a database, persistence, authentication, cloud service, external API, telemetry, or secrets;
- materially changing architecture, API contracts, public behavior, privacy behavior, or product scope.

Stop when approval is required, a protected behavior would need to change, verification exposes an architectural conflict, credentials are needed, or the requested outcome cannot be achieved safely within scope.

Platform permission prompts may still be required. Preferred runtime posture is
workspace write and network access enabled, automatic review enabled, and full
system access disabled. Do not create additional approval pauses when the
repository scope and milestone already provide authority.

## Milestone workflow

1. Read this manual and every repository operating-system document.
2. Inspect repository status, existing implementation, contracts, and tests.
3. Identify behaviors that must remain unchanged and the evidence that protects them.
4. Reuse existing components, utilities, state, architecture, and styling before adding abstractions.
5. Implement the smallest complete approved change without unrelated cleanup.
6. Run targeted tests and inspect the diff.
7. Self-review regressions, architecture, performance, accessibility, security, responsive behavior, and scope.
8. Run the independent checklist in [docs/VERIFICATION.md](docs/VERIFICATION.md).
9. Diagnose and fix routine in-scope failures without weakening tests, then repeat verification until clean.
10. Update only the documentation affected by the milestone.
11. Produce one milestone report and stop at the next approval gate.

Do not begin the next milestone merely because the current one passes.

## Documentation continuity

Keep technical debt, deferred work, future enhancements, known limitations, and
architectural decisions visible in the appropriate operating documents. Update
only documents materially affected by the milestone; do not rewrite unrelated
history or present planned work as released.

## Required self-review

Before reporting, confirm:

- preserved behavior still has direct regression evidence;
- no duplicate architecture or unnecessary runtime cost was introduced;
- new UI remains keyboard-operable, screen-reader understandable,
  reduced-motion compatible, and usable at documented widths;
- no secrets, credentials, PII, unsafe HTML, unnecessary persistence, or expanded
  permissions entered the change;
- only approved files changed and generated output remains excluded.

Fix routine findings within scope before reporting. Escalate only material
conflicts or stop conditions.

## Multi-agent work

When parallel agents are explicitly available and useful, assign non-overlapping
ownership: an Implementation Lead coordinates the milestone, a Review Agent checks
regressions and scope, a Visual QA Agent checks responsive and accessible behavior,
and a Security/Hygiene Agent checks dependencies and repository cleanliness.
Prefer isolated worktrees for independent write tasks. The coordinating agent must
review the integrated diff and rerun verification; human approval remains required
before merging or other gated Git operations.

## Milestone report

Use one completion report covering: objective, files changed, behavior added,
behavior preserved, tests added, verification, screenshots when applicable,
documentation updates, limitations, risks, next milestone, and commit
recommendation.
