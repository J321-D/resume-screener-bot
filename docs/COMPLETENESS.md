# V2.x requirement-to-evidence matrix

This is the terminal reconciliation of the Resume Keyword Screener program as of
2026-08-11. It deduplicates the complete product history against the current
repository. A requirement has exactly one state:

- **✅ Implemented** — repository evidence and verification exist.
- **❌ Rejected** — not implemented for a specific product or technical reason.
- **🟡 Blocked** — implementation or an external write requires an explicit gate.

There is no unclassified “future,” “later,” or “optional” bucket. The current
automated inventory is **190 checks**: 107 Python/API, 53 frontend
unit/accessibility, and 30 Playwright checks.

## Broad product concepts

| Concept family | State | Evidence or terminal reason |
| --- | --- | --- |
| Deterministic-product identity | ✅ Implemented | Skills-focused and Full lexical modes use the protected Python engine; UI, Methodology, Help, PDF, and API labels say lexical coverage rather than ATS prediction or candidate quality. |
| Full productization | ✅ Implemented | Public Next.js application, versioned FastAPI boundary, health/error contracts, reports, documentation, CI, deployment runbook, rollback, and legacy interface. |
| Futuristic premium presentation | ✅ Implemented | Semantic visual/motion tokens, restrained technical surfaces, deliberate hierarchy, current desktop/mobile captures, no fake metrics, no continuous ambient animation. |
| Unified design system | ✅ Implemented | `frontend/app/globals.css` and `docs/DESIGN_SYSTEM.md` centralize type, spacing, radii, surfaces, elevation, focus, interaction, motion, forced-colors, print, and responsive rules. |
| Power-user utilities | ✅ Implemented | Demo, keyboard-native controls, copy summary/terms, review search/filter/status/reset, Markdown checklist, PDF, print, retry, cancel, rerun, and New analysis. |
| Human-review philosophy | ✅ Implemented | Review decisions are user-authored, session-local, preserve engine order, never generate résumé copy, and clear when inputs become stale. |
| Privacy-first statelessness | ✅ Implemented | No accounts/database/application persistence; no-store API responses; no document/form analytics; bounded request-scoped upload resources are closed; provider metadata risk is disclosed. |
| User assistance, Q&A, and feedback | ✅ Implemented | Searchable categorized Help, deep links, contextual explanations, troubleshooting, glossary, synthetic examples, and transparent external GitHub feedback path with PII warning. |
| Recruiter/portfolio demonstration | ✅ Implemented | Synthetic demo, polished public screenshots, architecture asset, live/legacy links, badges, methodology, privacy, deterministic limitations, and repository metadata. |
| Resilience | ✅ Implemented | Central timeout constants, slow-service state, cancellation, retry, stale/race guards, invalid-response handling, report-specific recovery, cold-start guidance, and repeated-use tests. |
| Security and privacy | ✅ Implemented | Content/signature validation, size/archive/extraction/body bounds, private structured errors, exact-origin CORS, no-store, security headers, secret scanning, clean production dependency audits. |
| Operational maturity | ✅ Implemented | Runtime pins, CI, weekly dependency review, smoke script, provider topology, protected Preview, rollback target, observation checklist, and explicit deployment gates. |
| Public-web quality | ✅ Implemented | Canonical metadata, favicon, robots/sitemap, public Production, protected/noindex Preview, analytics route allowlist, 404, Help/Methodology/Privacy, social-preview asset, current screenshots. |
| Cross-platform completeness | ✅ Implemented | Automated Chromium, Firefox, and WebKit/mobile projects plus responsive, zoom, forced-colors, reduced-motion, keyboard, print, and no-overflow evidence. |
| Simplification | ✅ Implemented | One authoritative scoring engine, no client recomputation, native controls plus the existing small Framer Motion layer, no unused AI/dotenv dependencies, and no persistence layer. |

## Analysis and deterministic contracts

| Requirement | State | Evidence or terminal reason |
| --- | --- | --- |
| `Python SQL` versus `Python SQL MATLAB` remains 66.7% | ✅ Implemented | Python characterization/API tests and manual verification checklist. |
| Strict warning only below 30.0% | ✅ Implemented | `test_preserves_exact_rounded_warning_boundary_values` and Streamlit characterization. |
| Technical tokens `C++`, `C#`, `.NET`, `Node.js`, and hyphenated terms | ✅ Implemented | Tokenizer, normalization, missing-ranking, API, and integration tests. |
| Full lexical v1.0 compatibility | ✅ Implemented | Unique-token scoring, one-decimal rounding, filler terms, union, ordering, filtering, precedence, ranking, and warnings remain protected. |
| Skills-focused default | ✅ Implemented | Deterministic stop words, longest-first phrases, curated synonyms/taxonomy, category coverage, Uncategorized fallback, and explanations. |
| Uncategorized excluded from primary score but visible separately | ✅ Implemented | Category scoring, API/UI/PDF characterization, N/A behavior for empty categories. |
| Exact-frequency missing ranking and stable first occurrence | ✅ Implemented | `test_analysis.py` ranking suite and API/client ordered-contract tests. |
| Preserve original display surfaces and explain normalization | ✅ Implemented | First JD appearance and normalized-match tests; collapsed UI/PDF explanations. |
| Equal-weight lexical scoring | ✅ Implemented | Methodology documents the formula and limitation; no opaque weighting is applied. |
| Multiple résumés form one union | ✅ Implemented | Engine/API tests and UI copy document a single combined comparison. |
| Independently rank or score multiple candidates | ❌ Rejected | Would change the protected union contract and imply candidate-quality comparison. |
| Semantic similarity, stemming, fuzzy matching, embeddings, or AI weighting | ❌ Rejected | Would weaken deterministic reproducibility and expand privacy/capability claims. |
| AI rewriting, coaching, career paths, templates, peer review, interview preparation, or highlighting claims | ❌ Rejected | The product must not imply capabilities it does not perform; approximate highlighting lacks authoritative spans. |

## Documents, inputs, and resource safety

| Requirement | State | Evidence or terminal reason |
| --- | --- | --- |
| PDF, DOCX, UTF-8 TXT success paths | ✅ Implemented | Parser and API tests cover all three types. |
| Malformed, encrypted, image-only, corrupt, empty, unreadable, and unsupported inputs | ✅ Implemented | Typed parser/API errors and friendly UI tests; no raw stack traces. |
| Do not trust filename extension alone | ✅ Implemented | API detects `%PDF-`, validates DOCX ZIP structure, decodes UTF-8 text, then verifies suffix and reported MIME. |
| 10 MB file, five résumé, 25 MB aggregate, 200k pasted/extracted text bounds | ✅ Implemented | `document_service.py`, request middleware, client validation, and API tests. |
| Multipart expansion/decompression defense | ✅ Implemented | DOCX entry count, entry/total expanded size, ratio, encryption, and path checks. |
| Pre-parser whole-request bound | ✅ Implemented | 28 MB ASGI middleware handles declared and streamed bodies before multipart parsing. |
| Request resource cleanup | ✅ Implemented | Upload handles close on success and every early-error path; bounded spooled request body closes after downstream completion. |
| Active document content is never executed/rendered | ✅ Implemented | DOCX macros/relationships are not executed/fetched; DOCM unsupported; extracted text renders as escaped React/Streamlit text. |
| Server hard timeout for native PDF/DOCX parsing | ❌ Rejected | Cancelling a Python thread does not safely stop native parser work; true deadlines require isolated worker processes. Current bounded inputs, client timeout, threadpool isolation, and operational observation are proportionate. |
| OCR | ❌ Rejected | Changes processing, dependency, resource, and security boundaries; image-only PDFs receive a precise remediation message. |
| Input precedence ambiguity | ✅ Implemented | Manual JD text overrides uploaded JD; uploaded/manual résumé sources union. Tests and Architecture document both. |

## Workflow, assistance, and review

| Requirement | State | Evidence or terminal reason |
| --- | --- | --- |
| First-run onboarding without modal overload | ✅ Implemented | Compact three-step workflow and synthetic demo. |
| Searchable/categorized Help and glossary | ✅ Implemented | 17 deep-linked topics in five categories with search, result status, and no-results recovery. |
| Contextual “What does this mean?” guidance | ✅ Implemented | Results, modes, categories, review, exports, errors, Privacy, and Methodology link to relevant anchors. |
| Upload/paste/mode/review/rerun/export troubleshooting | ✅ Implemented | Help covers task flows, invalid documents, cold starts, network/timeouts/rate status, report recovery, stale state, and accessibility. |
| Canonical synthetic examples | ✅ Implemented | Demo fixtures and test fixtures contain no user data. |
| Four review statuses and reviewed/remaining progress | ✅ Implemented | Session-local review workspace with factual totals. |
| Review filters, search, reset, stale clearing, and checklist export | ✅ Implemented | Unit/E2E coverage confirms order, content, and lifecycle. |
| Non-persistent “Was this helpful?” | ❌ Rejected | A vote that reaches nobody is misleading and provides no product value. |
| Feedback/contact path | ✅ Implemented | Help links to GitHub Issues and explicitly discloses external storage/policies and forbids document/PII submission. |
| Stored feedback, submitted Q&A, comments, voting, accounts, histories, or notifications | ❌ Rejected | Requires identity, persistence, moderation, retention/deletion, abuse controls, and consent infrastructure. |
| Recruiter candidate-ranking workflow | ❌ Rejected | Conflicts with the human-review, non-assessment boundary; recruiters can inspect transparent lexical evidence without ranking people. |

## Presentation, motion, accessibility, and platform quality

| Requirement | State | Evidence or terminal reason |
| --- | --- | --- |
| Premium Apple/Tesla/technical direction without imitation | ✅ Implemented | Restrained dark instrument aesthetic, one accent system, layered surfaces, precise typography, no copied branding or excessive neon. |
| Coherent motion and state continuity | ✅ Implemented | Shared duration/easing tokens, upload/action/result/review/menu transitions, exact scores available immediately, no interaction delay. |
| Reduced motion | ✅ Implemented | CSS suppression and Playwright/unit evidence; no count-up or misleading animated score. |
| High contrast and forced colors | ✅ Implemented | Semantic native controls, visible focus, forced-colors rules, automated browser coverage. |
| Keyboard/screen-reader semantics | ✅ Implemented | Landmarks, headings, labels, live regions, disclosure semantics, focus transfer/restoration, Escape behavior, axe tests. |
| Mobile-first/reflow/zoom | ✅ Implemented | 320–1600 px guidance, 390×844 evidence, 200% zoom, 400%-equivalent narrow reflow, no horizontal overflow. |
| Cross-browser policy/evidence | ✅ Implemented | Chromium desktop, Firefox desktop, and iPhone 13 WebKit automation; evergreen Edge covered by Chromium compatibility target, not falsely claimed as separate manual evidence. |
| English-first unusual Unicode behavior | ✅ Implemented | Unicode-safe transport/PDF tests for accented Latin, Chinese, Japanese, Korean, mixed technical terms; no unsupported localization claim. |
| Print/export quality | ✅ Implemented | Native print action/static print CSS, Markdown checklist, copy utilities, Unicode PDF, clean report ordering. |
| Template downloads | ❌ Rejected | Static templates would imply résumé-authoring guidance outside deterministic analysis; no broken placeholder control remains. |
| Theme switcher | ❌ Rejected | Maintaining two complete accessible visual systems is disproportionate; forced-colors and user motion preferences remain first-class. |
| Additional animation dependency | ❌ Rejected | CSS/native capabilities plus the already established small Framer Motion layer meet the motion system; another bundle/runtime dependency has no justified capability. |

## API, privacy, security, and reliability

| Requirement | State | Evidence or terminal reason |
| --- | --- | --- |
| Stable typed `/api/v1` contract | ✅ Implemented | Pydantic schemas, OpenAPI contract tests, Zod runtime validation, no client-side score recalculation. |
| Consistent structured failures | ✅ Implemented | Parser, validation, 413, 429, 5xx, timeout, network, invalid-response, and report errors map to concise messages. |
| Centralized network timing | ✅ Implemented | `REQUEST_TIMEOUT_MS` and `SLOW_REQUEST_NOTICE_MS` are exported constants; tests use controlled promises/timers. |
| Cancellation, retry, repeated submission, and race protection | ✅ Implemented | AbortControllers, request IDs/snapshots, stale export blocking, late-response guards, repeated-lifecycle E2E. |
| Offline/cold-start/unavailable behavior | ✅ Implemented | Neutral slow-service guidance, retained inputs, retry/cancel, 429/502/503/504/network messages. |
| No raw document logging or analytics | ✅ Implemented | Application code logs neither input nor extracted terms; analytics accepts only fixed public paths and receives no form/document values. |
| Request privacy lifecycle | ✅ Implemented | No DB/storage APIs; no local/session storage; no document URLs; upload and download object URLs/listeners are revoked or removed. |
| Exact CORS | ✅ Implemented | Fail-closed configuration validates exact HTTP(S) origins; production and protected Preview only; wildcard denied. |
| Security headers | ✅ Implemented | Anti-sniffing, frame denial, referrer and permissions policy; canonical/noindex boundaries verified. |
| CSP | ❌ Rejected | No unsafe user HTML is rendered; a nonce/hash rollout risks Next.js/Analytics breakage without a concrete injection path. |
| Application IP rate limiter | ❌ Rejected | Privacy-sensitive per-instance state would not reliably protect a horizontally scaled/free service; strict resource bounds already exist. |
| Provider rate limiting | 🟡 Blocked | Requires provider configuration and possibly billing/privacy approval; no measured abuse currently justifies it. |
| Python dependency hardening | ✅ Implemented | FastAPI 0.141.1 and python-multipart 0.0.32; unused OpenAI/dotenv removed; clean install, 107 tests, `pip check`, and OSV audit pass. |
| Frontend dependency security | ✅ Implemented | Locked pnpm graph and `pnpm audit --prod` with no known production advisories. |
| Dedicated persistent Python scanner | ❌ Rejected | Adding another dependency/service is unnecessary for this release; a clean resolved-environment OSV query supplies current evidence. Reopen only if the existing check cannot cover an identified risk. |

## Operations, release, and public portfolio

| Requirement | State | Evidence or terminal reason |
| --- | --- | --- |
| Least-privilege CI | ✅ Implemented | `contents: read`, concurrency, timeouts, SHA-pinned third-party actions, Python/frontend/build/browser/security checks. |
| Fresh-clone reproducibility | ✅ Implemented | Python 3.10+ requirement, Python 3.12 production pin, Node 24/pnpm 11.16 lock, frozen install commands, clean-environment verification. |
| Deployment safeguards | ✅ Implemented | Automatic Render deploys off, exact Preview/Production targets, provider writes gated, no wildcard CORS, rollback documented. |
| Production smoke and observation | ✅ Implemented | Synthetic public smoke script, health, both modes, 66.7%, errors, PDF, CORS, analytics, and browser checks. |
| Analytics data quality | ✅ Implemented | Production-only exact-origin filter for `/`, `/methodology`, `/privacy`; queries/fragments stripped; no custom events. |
| SEO/indexing | ✅ Implemented | Canonical public origin, sitemap/robots, public Production, protected/noindex Preview and raw URLs. |
| Current screenshots, architecture, favicon, social preview | ✅ Implemented | Real 1440×900 and 390×844 V2 captures, architecture SVG, explicit favicon, 1280×640 social preview. |
| Legacy Streamlit disposition | ✅ Implemented | Kept online and clearly labeled v1.1.2 legacy/fallback; not redirected or represented as V2. |
| Nested repository disposition | 🟡 Blocked | Remains untracked/excluded; deletion, relocation, or incorporation is a separate destructive ownership decision. |
| Dependabot security updates/alerts | 🟡 Blocked | Enabling repository-provider settings is a GitHub write requiring approval. Existing weekly workflow and manual audits remain active. |
| Scheduled monitoring/automation | 🟡 Blocked | Requires automation/provider permissions, notification ownership, and failure-policy approval. |
| Custom domain | ❌ Rejected | The permanent public Vercel URL is accurate and stable; DNS/provider complexity adds no demonstrated value. |
| GitHub Release for the post-tag hardening baseline | 🟡 Blocked | Release/tag publication is a separate Git write; the existing `v2.0.0` tag remains accurate as the original public baseline. |
| Commit/push/deploy the integrated worktree | 🟡 Blocked | Mandatory pre-staging and Git/provider approval gates. No staging or external write is implied by implementation completion. |

## Accepted watch conditions

The legacy PyMuPDF `fitz` import and Starlette TestClient `httpx2` notices are
non-blocking upstream deprecations, not demonstrated defects. GitHub Actions
runtime notices are likewise watched. They become implementation work only when
a maintained migration is available and the notice becomes a compatibility,
security, or failing-test condition. This avoids dependency churn for appearance.

With the implemented, rejected, and blocked states above, no known justified
Resume Screener requirement is silently deferred.
