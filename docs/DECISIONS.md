# Architectural Decisions

## ADR-001: FastAPI application boundary

**Decision:** Expose the Python engine through a narrow, versioned FastAPI API.

**Reason:** A typed HTTP boundary supports multiple clients while preserving one engine implementation.

**Trade-offs:** Adds process orchestration, CORS configuration, and contract maintenance.

**Alternatives rejected:** Rewriting analysis in TypeScript; coupling Next.js directly to Python internals.

## ADR-002: Next.js presentation client

**Decision:** Use Next.js App Router and TypeScript for the Version 2 interface.

**Reason:** It provides a maintainable responsive client, typed contracts, and conventional deployment options.

**Trade-offs:** Adds a Node toolchain alongside Python.

**Alternatives rejected:** Expanding Streamlit beyond its compatibility role; a client-only scoring application.

## ADR-003: Protected deterministic engine

**Decision:** Treat parsing, normalization, matching, scoring, ranking, taxonomy, and reporting as protected behavior.

**Reason:** Compatibility and explainability depend on one characterized implementation.

**Trade-offs:** Algorithm changes require explicit review and broader regression evidence.

**Alternatives rejected:** Opportunistic algorithm changes during UI or transport work.

## ADR-004: Combined résumé analysis

**Decision:** Union multiple résumé documents and optional manual résumé text into one comparison.

**Reason:** Users may distribute relevant experience across documents; unique-set aggregation avoids duplicate inflation.

**Trade-offs:** Results describe the combined corpus rather than individual documents.

**Alternatives rejected:** Averaging document scores; silently choosing one résumé.

## ADR-005: No client-side scoring

**Decision:** The browser renders server-provided values and ordering without recalculation.

**Reason:** Prevents implementation drift and preserves deterministic parity across interfaces.

**Trade-offs:** Analysis requires access to the API process.

**Alternatives rejected:** Duplicating formulas or normalization in TypeScript.

## ADR-006: Server-side PDF generation

**Decision:** Generate reports with the protected Python reporting engine.

**Reason:** Preserves report semantics, ordered content, and Unicode behavior.

**Trade-offs:** Export requires a server request and recomputation against the current input signature.

**Alternatives rejected:** Browser-generated PDFs; rendering HTML screenshots as reports.

## ADR-007: No persistence by default

**Decision:** Do not intentionally store uploaded documents or analysis results.

**Reason:** Minimizes privacy risk and infrastructure complexity.

**Trade-offs:** Users cannot resume or compare prior sessions.

**Alternatives rejected:** Local databases or cloud storage without retention and deletion design.

## ADR-008: No AI scoring

**Decision:** Do not use generative AI, embeddings, or opaque models for coverage or candidate assessment.

**Reason:** Current value depends on deterministic, auditable lexical evidence.

**Trade-offs:** The tool does not infer semantic equivalence beyond curated mappings.

**Alternatives rejected:** External résumé scoring APIs; embedding similarity presented as fit.

## ADR-009: Dark-first visual system

**Decision:** Use a dark-first, neutral interface with restrained technical atmosphere.

**Reason:** Supports focused review and a distinctive engineering-product identity.

**Trade-offs:** The product maintains one fully verified dark visual system rather
than two partially tested themes. Forced-colors, visible focus, and reduced-motion
preferences remain supported.

**Alternatives rejected:** Bright marketing gradients; terminal or gaming aesthetics.

## ADR-010: Progressive disclosure for term lists

**Decision:** Show a bounded initial subset of long ordered term lists with accessible expansion.

**Reason:** Keeps results scannable without changing engine order or hiding total counts.

**Trade-offs:** Some terms require one additional interaction.

**Alternatives rejected:** Unbounded chip walls; client-side reprioritization or invented impact scores.

## ADR-011: Ephemeral client review state

**Decision:** Keep Version 2.1 review decisions in React state keyed to the successful analysis signature.

**Reason:** The workflow needs temporary presentation state, not persistence. Remounting on stale or unrelated analysis signatures prevents decisions from appearing under different inputs without storing document-derived data.

**Trade-offs:** Decisions disappear on refresh and cannot yet be shared or included authoritatively in the server PDF.

**Alternatives rejected:** `localStorage` or `sessionStorage` before a saved-workflow requirement; backend persistence; mutating the analysis response; trusting browser decisions as server report input without validation.

## ADR-012: Batched autonomous milestone execution

**Decision:** Treat an approved milestone as authority for one complete,
in-repository implementation and verification loop, while retaining explicit
human gates for protected, architectural, external, destructive, dependency, and
Git publication operations.

**Reason:** The user should make product and risk decisions while the engineering
agent handles routine implementation, diagnosis, self-correction, and verification
without interrupting after each file group or check.

**Trade-offs:** Milestone scope and invariants must be written clearly, and the
completion report must provide enough evidence for the user to review a larger
batch of work at once.

**Alternatives rejected:** Approval after every edit or test; unrestricted
autonomy that weakens protected boundaries; treating routine verification failures
as mandatory human decision points.

## ADR-013: Split preview hosting with no persistence

**Decision:** Host the private Version 2 release candidate with the Next.js
frontend in an access-protected Vercel Preview and the FastAPI boundary on Render.
Pin Python 3.12 and pnpm 11.16.0, disable automatic Render deploys, configure CORS
for the exact Preview origin, and add no database or persistent disk.

**Reason:** The split follows the existing application boundary, keeps the Python
engine authoritative, and permits independent health and browser validation while
leaving the published Streamlit application unchanged.

**Trade-offs:** The frontend API origin is embedded at build time, preview origins
must be synchronized with the backend allowlist, free hosting may cold-start, and
provider request metadata is governed by external retention policies.

**Alternatives rejected:** Rewriting the engine for a serverless frontend runtime;
adding Docker without a runtime need; wildcard CORS; introducing persistence;
replacing Streamlit before the release candidate is verified.

## ADR-014: Public Version 2 release with legacy rollback

**Decision:** Serve the verified Version 2 frontend publicly at
`https://resume-keyword-screener.vercel.app`, keep the FastAPI service on Render,
and allow only that exact frontend origin plus the exact stable access-protected
Preview origin through CORS. Preserve the Streamlit v1.1.2 deployment as a
separate legacy demo and fallback. Keep Preview and raw deployment URLs
access-protected and deny deployment-specific origins.

**Reason:** The verified Next.js workflow becomes the primary public experience
without discarding the stable compatibility interface or weakening the API's
origin boundary.

**Trade-offs:** The public browser submits document content to the Render service
for request-scoped processing; bounded multipart handling may use temporary
spooling. Provider request metadata remains subject to provider policies, and the
free Render service may cold-start. The public API origin remains embedded at
frontend build time.

**Alternatives rejected:** Wildcard CORS; retiring Streamlit during promotion;
making Preview deployments public; introducing persistence; changing application
behavior as part of the release-state transition.

## ADR-015: Privacy-safe aggregate Web Analytics on Hobby

**Decision:** Mount Vercel Web Analytics only in the production Next.js client,
allow page views only for the exact public origin at `/`, `/methodology`, and
`/privacy`, remove query strings and fragments before transmission, and define no
custom interaction events.

**Reason:** Aggregate visitors, page views, referrers, approximate region, browser,
operating system, and device category provide useful product visibility without
transmitting submitted document or form content. Development and tests use the
package's non-transmitting mode.

**Trade-offs:** Vercel receives anonymous aggregate request-derived metadata under
its own retention policies. The Hobby plan cannot measure analysis, review, or
export funnels because custom events require a paid plan.

**Alternatives rejected:** Adding a second analytics provider; session replay;
free-form event properties; encoding state in URLs; upgrading the plan without a
separate billing decision.

## ADR-016: Native, truthful interaction system

**Decision:** Use semantic HTML, CSS/SVG, native browser behavior, the existing
small motion layer, and shared visual/motion tokens. Scores are exposed at their
final value immediately; only supporting surfaces and the ring arc may settle.
Low-intensity ambient motion is confined to the original analysis core and reacts
only to real page state. General decorative loops, canvas UI, video backgrounds,
fake telemetry, fake internal progress, fullscreen presentation mode, sound, and
haptics are excluded.

**Reason:** The product should feel advanced through real state, spatial
continuity, accessibility, and precision—not decoration or fabricated engine
activity.

**Trade-offs:** The visual system intentionally uses fewer spectacular effects
and retains a dark-only theme. Reduced-motion, forced-colors, print, selection,
browser find, and native controls remain first-class fallbacks.

## ADR-017: Bounded stateless request lifecycle

**Decision:** Snapshot each submitted request, assign identity with its
AbortController, reject late responses, time out client requests, retain inputs
for manual retry, and make New analysis an explicit confirmed purge of current
React state. Do not automatically retry POST requests or persist session data.

**Reason:** Duplicate compute has no durable side effect, but automatic retries
and stale responses create ambiguous UI. Manual retry is transparent; per-tab
React state naturally isolates concurrent tabs without shared storage.

**Trade-offs:** Browser duplication/BFCache may copy or restore ordinary browser
memory. Application code can clear its references but cannot promise immediate
runtime memory erasure.

## ADR-018: Cache, indexing, and API compatibility boundaries

**Decision:** Mark analysis/report responses `no-store`, keep public static pages
cacheable, use the Production host as canonical, and emit noindex controls for
Preview builds. Keep `/api/v1` stable across product UI versions; introduce new
evidence only through the opt-in `/api/v2` envelope.

**Reason:** User-derived responses should not be cached, Preview copies should not
compete in search, and product marketing versions do not justify transport churn.

**Trade-offs:** Environment-specific indexing is build-scoped and must be checked
on Preview/Production. FastAPI OpenAPI remains intentionally public for
transparency and contract inspection; it is not advertised as a supported
third-party service.

## ADR-021: Add privacy-bounded evidence without echoing documents (superseded in part)

**Decision:** Add opt-in `/api/v2/analyze` as an envelope around the unchanged v1
result. Return deterministic finding/evidence identity, exact half-open Unicode
offsets, matched surface terms, source kind, and explicit unknown metadata. Do
not return full canonical text or full-document hashes.

**Reason:** Evidence-level provenance and comparison keys are useful, but
returning complete extracted documents would materially expand sensitive-data
exposure. Request-local document labels disclose less while remaining stable for
identical ordered Contract 2.0 requests.

**Trade-offs:** At this stage full uploaded-document X-Ray remained blocked because a browser
cannot apply server offsets without the identical canonical text. Sections,
formatting, severity, and diagnostics remain explicitly unknown rather than
being inferred.

## ADR-022: Adopt Contract v2 through one additive frontend view model

**Decision:** Request `/api/v2/analyze`, validate the envelope at runtime, and
adapt the unchanged carried v1 result plus evidence into one presentation model.
Use finding IDs—not term indexes—for v2 review/evidence links. Preserve an
explicit evidence-unavailable fallback when a valid v1 response is received.

**Reason:** TRACE, provenance filtering, and Machine View need authoritative
server fields and stable identity. A single adapter prevents components from
reinterpreting scores or reconstructing source content.

**Trade-offs:** The initial browser rendered exact matched surfaces and offsets
only. ADR-027 later approved exact canonical document blocks; section, formatting,
severity, persistence, and the v1 report endpoint remain unchanged.

## ADR-019: Focused supply-chain and operational hardening

**Decision:** Resolve known frontend advisories with narrow pnpm overrides, run
least-privilege CI and weekly Dependabot checks, and provide a synthetic-only
public smoke tool. Use lockfiles and audits rather than adding an SBOM platform.

**Reason:** These controls improve reproducibility and detection without a major
framework migration, deployment automation, private artifacts, or enterprise
supply-chain infrastructure.

**Trade-offs:** Python vulnerability auditing requires a separate trusted audit
tool beyond `pip check`; installation is handled under the normal dependency
approval boundary.

## ADR-020: Close V2.x on one verified production baseline

**Decision:** Treat commit
`e8e638b971e94f2156e61c3e33e31ccbc00e159d` and the matching Vercel Production,
protected Preview, and Render deployments recorded in
[DEPLOYMENT.md](DEPLOYMENT.md) as the authoritative V2.x release baseline. Freeze
feature scope after release reconciliation. A later version tag, GitHub Release,
asset refresh, or product capability is a separately approved milestone.

**Reason:** A single evidence-backed baseline keeps code, CI, provider routing,
privacy controls, rollback evidence, and public documentation aligned without
extending the release merely for presentation completeness.

**Trade-offs:** The existing `v2.0.0` tag remains the original public baseline,
while the deployed hardening commit is newer and untagged. GitHub release metadata
and screenshots can lag until their separate approval gates are completed.

**Alternatives rejected:** Retagging published history; adding more features before
closure; changing providers; treating optional polish as a release blocker.

## ADR-021: Searchable assistance without application persistence

**Decision:** Provide server-rendered, client-enhanced searchable Help with
categories, deep links, contextual explanations, troubleshooting, glossary,
synthetic examples, and a transparent external GitHub issue link. Store no
questions, votes, histories, or feedback in the application.

**Reason:** Users need interpretation and recovery guidance, while a persistent
support/community system would require identity, moderation, retention, consent,
spam controls, and a different privacy architecture.

**Trade-offs:** GitHub feedback follows GitHub's policies and users are explicitly
warned never to include résumé content or PII. A fake local “Was this helpful?”
vote is excluded because it would not reach maintainers.

## ADR-022: Pre-parser bounds and focused dependency surface

**Decision:** Bound complete analysis/report request bodies before multipart
parsing, validate file signatures and archive structure, cap extracted text, run
synchronous parser/report work off the event loop, and close upload resources on
all paths. Use FastAPI 0.141.1 and python-multipart 0.0.32; remove unused OpenAI
and dotenv dependencies.

**Reason:** These controls limit memory/decompression abuse, close published
multipart risks, and keep the repository consistent with its deterministic no-AI
capability boundary.

**Trade-offs:** Native PDF/DOCX work has no pretend thread-kill timeout; safe hard
deadlines require isolated worker processes. The supported Python floor is 3.10.

## ADR-023: Terminal product disposition

**Decision:** Reconcile every recovered product concept as implemented, rejected
for a concrete reason, or externally blocked in
[COMPLETENESS.md](COMPLETENESS.md). Do not maintain a generic idea backlog.

**Reason:** Terminal states prevent capability inflation, silent deferral, and
scope extension after the verified product program is complete.

**Trade-offs:** A rejected concept reopens only with concrete new evidence or a
separately approved architecture/provider/data decision.

## ADR-024: Bound résumé-variant comparison to current React memory

**Decision:** Resume Lab creates a run only from a successful analysis response,
retains at most five runs and three résumé identities for one job-description
identity, and relates findings only through Contract v2 comparison keys. A new
job description starts a new Lab session. Review decisions and notes are per-run
and do not propagate. Clear, New analysis, demo clear, refresh, or tab close
removes all retained Lab state. No browser or server persistence is introduced.

**Reason:** This provides truthful before/after and variant comparison while
preserving the stateless privacy architecture and deterministic engine contract.

**Trade-offs:** History cannot survive refresh or tab close; file identities are
opaque non-cryptographic UI keys rather than proof of document identity; only
same-job, same-mode Contract v2 runs are comparable; full-document X-Ray and PDF
comparison remain unavailable.

**Alternatives rejected:** localStorage, IndexedDB, URL serialization, server
history, automatic decision transfer, text-only finding matching, unbounded run
retention, and causal or hiring-probability claims.

## ADR-025: Keep résumé revision explicit and temporary

**Decision:** The Revision Workspace edits a text copy in current React memory,
never the original upload. It performs no autosave or autosubmit. Run Revision
uses the existing v2 endpoint, creates a Lab run only after success, records the
`temporary_text_revision` source type, and compares through the existing
Contract v2 model. Upload-only analyses do not receive their canonical text back;
the revision editor starts blank.

**Reason:** This completes the analyze → inspect → revise → rerun → compare loop
without persistence, AI rewriting, a second comparison engine, or broader source
disclosure.

**Trade-offs:** Refresh, reset, clear, or tab close destroys application
references without promising secure erasure. Users must deliberately paste a
text revision for upload-only runs. The successful temporary text becomes the
active input representation but never modifies or generates a PDF/DOCX file.

## ADR-026: Gate full-document X-Ray and semantic sections (superseded in part)

**Decision:** Do not return full canonical documents or infer sections yet. The
three disclosure models and parser limitations are recorded in
[XRAY_PRIVACY_AND_SECTIONS.md](XRAY_PRIVACY_AND_SECTIONS.md).

**Reason:** Every readable full-document option materially expands sensitive
content in browser memory, while the existing parsers flatten text and cannot
authoritatively identify semantic sections.

**Trade-offs:** TRACE remains limited to exact returned matched surfaces until a
separate privacy decision and parser-contract review are approved.

## ADR-027: Approve request-scoped canonical blocks for Document X-Ray

**Decision:** Add contiguous deterministic document-view blocks to Contract v2
and render them as escaped text nodes in Resume/JD X-Ray. Blocks preserve every
canonical Unicode code point and map represented evidence by stable IDs and exact
global offsets. Missing findings remain a separate gap layer. No document text is
persisted, logged, analyzed by telemetry, or placed in URLs/browser storage.

**Reason:** Exact full-document inspection and scanner/TRACE synchronization are
valuable only when the server provides the authoritative canonical representation.
The user explicitly approved the documented browser-memory disclosure after the
three alternatives were reviewed.

**Trade-offs:** The response now contains sensitive canonical text and increases
payload/browser-memory exposure; `no-store` is not secure erasure and does not
prevent user copies, screenshots, extensions, or developer tools. Semantic
sections, formatting diagnostics, severity, and invented provenance remain
unavailable because the parsers and engine do not produce them. PDF semantics
remain protected and unchanged.

## ADR-028: Add conservative sections and factual diagnostics

**Decision:** Preserve canonical extraction and add only exact semantic sections
from explicit DOCX heading styles, emphasized PDF text lines, or conservative
standalone known headings. Return stable section ranges and evidence references
through Contract v2. Evaluate a small factual diagnostic inventory covering text
extraction, section availability/repetition, the existing strict 30% boundary,
and returned lexical opportunities. Redesign only PDF presentation and provide a
separate client-side print view for comparable Resume Lab runs.

**Reason:** These observations are mechanically supportable and useful for X-Ray,
TRACE, and review without changing analysis semantics or presenting repository
tests as résumé checks.

**Trade-offs:** The English-first heading vocabulary intentionally misses
unconventional structure. PDF/DOCX style signals must map exactly to canonical
text; otherwise the result is unavailable. Visual formatting quality, section
hierarchy, requirement severity, contact readiness, and hiring readiness remain
unknown. Comparison print is not a server PDF and disappears with session state.

**Alternatives rejected:** Frontend heading guesses; approximate section spans;
confidence scores without a calibrated model; subjective formatting advice;
serializing client comparison state into the protected report endpoint.
