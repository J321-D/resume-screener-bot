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
