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

**Trade-offs:** Theme support requires future token and contrast work.

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
for in-memory processing, provider request metadata remains subject to provider
policies, and the free Render service may cold-start. The public API origin remains
embedded at frontend build time.

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
Idle ambient loops, canvas UI, video backgrounds, fake telemetry, fake progress,
fullscreen presentation mode, sound, and haptics are excluded.

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
Preview builds. Keep `/api/v1` stable across product UI versions; a future API v2
requires an incompatible contract.

**Reason:** User-derived responses should not be cached, Preview copies should not
compete in search, and product marketing versions do not justify transport churn.

**Trade-offs:** Environment-specific indexing is build-scoped and must be checked
on Preview/Production. FastAPI OpenAPI remains intentionally public for
transparency and contract inspection; it is not advertised as a supported
third-party service.

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
