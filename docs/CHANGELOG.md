# Changelog

All notable changes are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions and uses semantic versioning where releases are published.

## [Unreleased]

### Added

- Added privacy-bounded `POST /api/v2/analyze`, carrying the unchanged v1 result
  plus deterministic lexical finding/evidence identity, exact half-open Unicode
  offsets, matched surfaces, and explicit unavailable metadata.
- Added focused Contract v2 tests for deterministic identity, v1 parity, input
  precedence, repeated terms, technical punctuation, case variants, Unicode,
  multiple résumé provenance, privacy, and structured errors.
- Added frontend Contract v2 runtime validation and a single additive analysis
  view model while preserving v1 compatibility and all carried result fields.
- Added Evidence Explorer filters, TRACE/provenance inspection, Machine View,
  stable finding-ID review links, and Living Report evidence disclosure.
- Added Resume Lab with a bounded in-memory run model, one-role résumé hangar,
  authoritative comparison matrix, before/after Diff Reactor, run timeline,
  per-run decisions/notes, fictional variants, and explicit session clearing.
- Added comparison-key-derived newly represented, no-longer represented,
  unchanged, new, and removed finding states without changing analysis output or
  PDF report semantics.
- Added a Temporary Revision Workspace that keeps text in current React memory,
  never autosubmits, labels temporary-text runs explicitly, and compares a
  successful explicit rerun against the selected Resume Lab baseline.
- Added explicitly approved, contiguous canonical document-view blocks to
  Contract v2 and exact Resume/JD X-Ray with source switching, represented-only
  overlays, scanner controls, keyboard navigation, and synchronized TRACE.
- Added exact conservative semantic sections, section-aware X-Ray disassembly,
  and explicit unknown states for ambiguous or unsupported source structure.
- Added a real per-request diagnostics inventory for text extraction, section
  availability/repetition, the strict 30% boundary, and coverage opportunities.
- Redesigned the Unicode PDF as a static precision dossier without changing
  analytical order or limits, and added a separate Resume Lab print comparison.
- Documented the full-document disclosure decision and the independent
  section-aware parser/diagnostics gate without inventing semantic metadata.

### Security

- Kept Contract v2 request-scoped and `no-store`; approved canonical blocks are
  returned only to the requesting browser and add no reusable document hashes,
  persistence, content logging, analytics, or external calls.
- Kept Resume Lab source inputs and comparisons out of browser persistence,
  URLs, analytics, and server storage; refresh and explicit clearing destroy the
  bounded application references without claiming secure memory erasure.

### Added

- Added an original analysis-core hero with a CSS-first boot sequence, restrained
  ambient motion, real analyzer-state reactions, and a reduced-motion-specific path.
- Added a truthful three-stage request timeline, evidence/category focus mode,
  exact-versus-normalized labels, a contextual command palette, and keyboard-first
  review-row controls without changing engine output or review decisions.
- Added a deterministic analysis fingerprint, paired résumé/role category-count
  blueprint, and session-only Overview/Standard/Dense result views.
- Added ordered Gap Mode review, a factual Mission Board, session-only finding
  notes, resolved-item advancement, and command-palette access.
- Added a result walkthrough/minimap, screen-first Living Report, original motion-brand
  treatment, Showcase Mode, Precision Lab light mode, and an opt-in local-only performance HUD.
- Added a bounded procedural Canvas field for the analysis core, an exploded
  Methodology architecture view, and explicit walkthrough-to-result optical continuity.
- Added a dependency-free 180 KiB gzip home-route JavaScript budget and explicit
  iPhone WebKit browser coverage.
- Added anonymous aggregate Vercel Web Analytics for the three fixed public pages.
- Added a defensive path filter that strips queries and rejects unapproved paths,
  with local development and tests kept on the non-transmitting mode.
- Added a synthetic demo, responsive navigation and Help route, explicit session
  reset, copy utilities, print output, and coherent 404/error recovery.
- Added bounded request timeout, cancellation, manual retry, request-snapshot
  identity, and neutral cold-start guidance.
- Added CI, weekly Dependabot checks, a synthetic public smoke tool, a security
  policy, and an accurate architecture SVG.
- Added searchable categorized Help with deep links, contextual explanations,
  troubleshooting, glossary, synthetic guidance, and a transparent privacy-safe
  feedback path.
- Added pre-parser whole-request limits, post-extraction limits, upload-resource
  cleanup, signature validation, and Chromium/Firefox/WebKit browser coverage.
- Added a terminal requirement-to-evidence matrix covering the complete V2.x
  product program.

### Changed

- Consolidated the dark technical visual system around semantic spacing, motion,
  focus, surface, and layering tokens with quieter mobile composition.
- Removed fake hero counts and score count-up animation while preserving the final
  score and engine-provided ordering; ambient motion is now confined to the
  product-specific analysis core.
- Added factual source metadata, review-visible counts, completion language, and
  confirmed New analysis semantics.
- Deployed the complete V2.x hardening baseline at commit
  `e8e638b971e94f2156e61c3e33e31ccbc00e159d` to the public Production frontend,
  protected Preview, and Render API without changing the deterministic engine.
- Restored the stable Preview alias to the Preview target, restricted Render CORS
  to the exact public and stable protected Preview origins, and verified the
  previous Production deployment as an available rollback build.
- Closed and feature-froze the V2.x scope after live reconciliation. No post-v2.0
  semantic-version tag or GitHub Release has been created yet.
- Raised the supported Python floor to 3.10, updated FastAPI to 0.141.1 and
  python-multipart to 0.0.32, and removed unused OpenAI/dotenv dependencies.

### Security

- Analytics excludes document content, filenames, extracted terms, report data,
  form input, query strings, and custom interaction events.
- Analysis/report responses use `Cache-Control: no-store`; pasted text and total
  uploads are bounded consistently at client/API boundaries.
- DOCX requests now reject suspicious entry count, expansion size, compression
  ratio, encryption, and unsafe archive paths before parsing.
- Preview builds are noindex, Production remains canonical, and the frontend adds
  anti-sniffing, framing, referrer, and browser-capability headers.
- Patched frontend transitive advisories through narrow pnpm overrides without a
  major framework migration.
- Verified the clean resolved Python environment with 118 tests, `pip check`, and
  an OSV package/version audit with no known findings.

## Version 2 public release candidate — 2026-08-10

The Version 2 application is publicly deployed and tagged as `v2.0.0`. A GitHub
Release has not yet been created.

### Version 2 public release-candidate milestone

#### Added

- Added a Render Blueprint for the FastAPI release-candidate service with a health
  check and automatic deploys disabled.
- Added explicit Python and pnpm runtime configuration for reproducible cloud
  builds.
- Added a Vercel/Render deployment, privacy, verification, and rollback runbook.
- Created and verified an access-protected Vercel Preview backed by the Render API.
- Verified both analysis modes, uploads, review state, Markdown and PDF downloads,
  exact-origin CORS, structured errors, provider-log privacy, and responsive layouts.

#### Changed

- Promoted the verified Version 2 frontend to the permanent public Vercel origin.
- Restricted Render CORS to the exact public frontend origin while preserving
  protected Preview deployments and the Streamlit v1.1.2 legacy demo.

#### Security

- Kept document processing non-persistent, required exact frontend CORS origins,
  and documented provider request-metadata risk.
- Preserved the Streamlit v1.1.2 deployment as a separate legacy and rollback
  interface.

### Repository operating-system autonomy milestone

#### Changed

- Defined Product Owner and Engineering Lead responsibilities for approved milestones.
- Required batched implementation, routine failure recovery, consolidated reporting, and regression-first self-review.
- Expanded accessibility, cross-browser, performance, security, and Git-hygiene verification guidance.
- Documented future automation candidates without implementing or authorizing them.

### Version 2.1 review workspace milestone

#### Added

- Session-local opportunity review with Add to résumé, Already represented, Not relevant, and Review later decisions.
- Review progress, status totals, filtering, search, reset confirmation, and ordered Markdown action checklist export.
- Desktop/mobile browser coverage for review decisions and stale-analysis invalidation.

#### Security

- Review decisions remain in React memory, store no raw documents, and clear when the current analysis becomes stale.

### Repository operating system

#### Added

- Repository operating manual and contributor documentation.

### Version 2 application milestone — complete

#### Added

- FastAPI application boundary with versioned analysis, report, health, and error contracts.
- Next.js App Router frontend with typed API validation.
- Responsive upload and pasted-text workspace for both analysis modes.
- Coverage dashboard, category summaries, normalization explanations, and server-side PDF download.
- Frontend unit, accessibility, contract, and Playwright browser tests.

#### Changed

- Elevated the interface with a premium dark-first visual system, clearer hierarchy, and responsive navigation.
- Made coverage the primary results focal point.
- Added accessible progressive disclosure for long matched and opportunity lists.
- Added restrained result motion and immediate reduced-motion rendering.

#### Security

- Preserved local document processing, non-persistence, upload validation, private public-error mapping, and stale-result export protection.

## [1.1.2] — 2026-08-06

### Changed

- Improved phrase consumption, possessive cleanup, focused filtering, categorized scoring, and chart clarity.
- Preserved Full lexical v1.0 compatibility behavior.

## [1.0.0]

### Added

- Unicode-safe PDF reports.

[1.1.2]: https://github.com/J321-D/resume-screener-bot/compare/v1.0.0...v1.1.2
[1.0.0]: https://github.com/J321-D/resume-screener-bot/releases/tag/v1.0.0
