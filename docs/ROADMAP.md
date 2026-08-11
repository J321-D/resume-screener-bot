# Roadmap

Priorities: **P0** release-critical, **P1** next planned work, **P2** valuable follow-up, **P3** exploratory.

## Version 2.0 — Complete

- [x] **P0** Preserve the deterministic Python engine
- [x] **P0** Add the FastAPI application boundary and typed contracts
- [x] **P0** Add the responsive Next.js workflow
- [x] **P0** Verify parity, uploads, errors, PDF export, and stale-result protection
- [x] **P1** Establish the premium visual system and results hierarchy
- [x] **P1** Add accessible progressive disclosure and reduced-motion behavior
- [x] **P1** Create the repository operating system

## Version 2.1 — Review workspace

- [x] **P1** Add a focused review workspace for moving between findings
- [x] **P1** Add privacy-safe aggregate page analytics on the Vercel Hobby plan
- [ ] **P2** Revisit low-cardinality workflow events only after a separately
  approved paid-plan decision
- [ ] **P2** Revisit exact source-context highlighting only if the engine exposes
  occurrence data; approximate client highlighting is intentionally skipped
- [ ] **P2** Revisit a theme switcher only if user need outweighs the cost of
  maintaining two complete accessible systems
- [x] **P1** Add portable PDF, Markdown checklist, print, and copy utilities
- [x] **P2** Expand browser coverage for review-state interactions

Approval gate: preserve engine calculations and API contracts; approve any new dependency before implementation.

## Version 2 public release — Complete

- [x] **P0** Define the Render FastAPI and Vercel Next.js release topology
- [x] **P0** Add runtime pins, health checks, exact-origin CORS guidance, and rollback documentation
- [x] **P0** Keep automatic backend deploys off and preserve the stable Streamlit deployment
- [x] **P0** Connect external accounts and verify protected preview services after explicit approval
- [x] **P0** Validate hosted analysis, upload errors, responsive behavior, and PDF download
- [x] **P0** Promote the verified frontend to the permanent public Vercel origin
- [x] **P0** Restrict Render CORS to the exact public and stable protected Preview origins
- [x] **P0** Preserve the Streamlit v1.1.2 deployment as a legacy rollback demo
- [x] **P1** Create the annotated `v2.0.0` Git tag
- [ ] **P1** Decide whether to create a GitHub Release separately

Approval gate: no provider login, repository connection, service creation,
credential or environment-variable write, deployment, domain change, or public
promotion occurs without explicit user approval.

## V2.x hardening — Complete

- [x] **P1** Add a clearer responsive menu, navigation model, Help, and synthetic demo
- [x] **P1** Harden request lifecycle, stale results, retry/cancel, and New analysis
- [x] **P1** Consolidate the restrained futuristic visual/motion system
- [x] **P1** Add input/archive/cache/indexing/security boundaries and CI operations

The public V2.x feature scope is now frozen. Any further capability or visual idea
starts a new milestone rather than extending this release.

## Next milestone candidates

- [ ] **P2** Expand the review workspace only where richer guided flows have
  demonstrated user value
- [ ] **P1** Add a customer Q&A and feedback path with explicit privacy boundaries
- [ ] **P2** Deepen menu/navigation only where validated workflows require it
- [ ] **P2** Apply further restrained futuristic Apple/Tesla/cyberpunk refinement
  without excessive neon, gaming aesthetics, or reduced accessibility
- [ ] **P2** Design saved analyses only after explicit privacy and retention rules
- [ ] **P1** Compare multiple analyses without introducing candidate-quality ranking
- [ ] **P2** Add a recruiter review workflow with transparent lexical evidence
- [ ] **P2** Define export and deletion controls for persisted data

Approval gate: persistence, authentication, and data migration require separate architecture and threat-model review.

## Version 3 — Exploratory platform

- [ ] **P2** AI-assisted rewriting with user-controlled suggestions and provenance
- [ ] **P2** Enterprise deployment and governance mode
- [ ] **P3** Collaboration and review comments
- [ ] **P3** Plugin architecture with capability boundaries

Approval gate: no AI, external service, enterprise data path, or plugin execution may begin without explicit product, security, and privacy decisions.

## Operational watch items

These accepted risks are not current release blockers. Reevaluate them only when
their trigger occurs:

- Content Security Policy: revisit when executable/content sources expand, a
  security review identifies a concrete injection path, or a nonce/hash rollout
  can be verified with Next.js and Vercel Analytics without breaking the app.
- Python CVE tooling: add a vetted scanner only after a dependency/tool approval or
  when Dependabot/provider advisories identify a Python package concern; `pip
  check` validates compatibility, not vulnerabilities.
- Provider/API rate limiting: revisit if abuse, capacity, cost, or latency evidence
  appears; do not add stateful infrastructure speculatively.
- GitHub Actions runtime notices: move to maintained action majors when available
  and verified. The current green run reports Node 20 action-metadata deprecation
  while GitHub forces those actions onto Node 24, plus upstream `punycode`,
  `url.parse()`, legacy ESLint configuration, and PyMuPDF `fitz` notices.

Add proposals only after documenting user value, scope, privacy impact, contract
impact, verification strategy, and dependencies.

## Repository automation candidates

These are documented future operations improvements, not implemented automation:

- Nightly locked-dependency build and full test run
- Scheduled dependency and license review
- Scheduled security and secret-scanning review
- Cross-browser screenshot-regression review
- README and verification-count drift check
- Issue-triage assistance with human-owned prioritization
- Deployment-health checks after an explicitly approved deployment

Each automation requires separate approval of permissions, runtime, reporting,
failure handling, and any external service before implementation.
