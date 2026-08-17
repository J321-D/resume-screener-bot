# Analysis Contract v2

`POST /api/v2/analyze` is an additive, privacy-bounded evidence contract. It
wraps the unchanged `/api/v1/analyze` result and adds deterministic provenance
for the lexical findings that the engine already produces. It does not change
scoring, ranking, matching, normalization, parsing, input precedence, reports,
or the current frontend.

## Response boundary

The response contains:

- `analysis`: the complete existing v1 response
- `source_documents`: source kind, media type, character count,
  request-local document ID, conservative semantic sections or an explicit
  unknown state, formatting unknowns, and ordered canonical document-view blocks
- `findings`: stable rule/finding/comparison identifiers, status, reason,
  category, display and normalized terms, match method, and evidence occurrences
- `diagnostics`: the factual parser, structure, and coverage rules evaluated for
  this request—not the development verification inventory

The endpoint returns `Cache-Control: no-store`, uses the same bounded multipart
validation and structured errors as v1, and makes no external calls.

## Coordinate semantics

Every available `source_span` is a half-open `[start, end)` range measured in
Python Unicode code points against the exact canonical extracted-text string used
by the server for that document. `matched_surface` is exactly
`canonical_text[start:end]`. Offsets do not target the original PDF/DOCX binary,
rendered pages, UTF-8 bytes, a browser-normalized string, or a reconstructed
document. Repeated terms receive separate occurrences in source order.

Each document-view block contains an exact, unmodified slice of canonical text,
global half-open offsets, an explicit unknown block type, and the IDs of evidence
records that overlap it. In order, blocks start at zero, are contiguous, and end
at `canonical_text_characters`; concatenating their text reconstructs the exact
canonical representation, including Unicode, punctuation, whitespace, and empty
lines. A single evidence occurrence may overlap more than one block. Consumers
must use the global offsets rather than infer block-relative or semantic meaning.

Each available semantic section is an exact half-open range in the same canonical
coordinate system. It starts at its returned heading and ends at the next
accepted heading or document end. `heading_span` reconstructs `raw_heading`
exactly. Evidence receives a section reference only when its complete span is
contained by that section.

## Identity guarantees

- Document IDs (`resume_1`, `resume_2`, `job_description_1`) are stable for an
  identical ordered request within Contract 2.0. They disclose no content hash.
- `finding_id` is derived from the real rule ID and normalized term.
- `comparison_key` is derived from the rule ID and normalized term, never array
  position. It identifies corresponding lexical findings across identical
  Contract 2.0 semantics.
- `evidence_id` is derived from document ID, span, and normalized term.

These identifiers are UI/comparison keys, not secrets, anonymization, integrity
proofs, or promises of stability across a future contract or rule revision.

## Match methods and rules

Only two existing rules are named:

- `full_lexical.token_coverage`
- `skills_focused.concept_coverage`

Methods are limited to behavior the engine already performs: `exact`,
`documented_phrase`, `curated_synonym`, and `not_detected`. Missing findings have
job-description evidence only and never claim a résumé location. Raw display and
matched surface forms remain separate from normalized concepts.

## Conservative sections and explicit unknowns

Sections use only an explicit tested vocabulary and one of three deterministic
methods: a DOCX heading style whose exact text maps to canonical extraction, an
emphasized PDF line whose exact text maps to canonical extraction, or a narrowly
bounded standalone known heading in text. Ambiguous prose, heading-like bullets,
unmappable metadata, unknown headings, and cross-section evidence remain
`not_detected` rather than receiving an approximate section.

Original page/layout structure and formatting quality remain
`parser_limitation`. The contract does not expose requirement severity,
candidate readiness, hiring confidence, or parser timing.

## Deterministic diagnostics

The per-request inventory contains only successful canonical-text extraction,
section availability, repeated detected section types, the established strict
below-30.0% boundary, and returned lexical opportunities. Statuses are `pass`,
`review`, or `unavailable`; there is no arbitrary severity. These rules do not
claim résumé quality, ATS acceptance, visual-format quality, or hiring readiness.

## Privacy and lifecycle

Résumé/JD text reaches the FastAPI service for request-scoped in-memory parsing
and analysis exactly as it does for v1. Application code does not persist or log
document text, spans, identifiers, evidence, or responses. V2 adds no database,
history, analytics event, telemetry provider, or external request. It returns
document hashes, or external calls. The approved document-view blocks do return
the full canonical extracted text to the requesting browser for the current
analysis. That text exists in request/response and React memory, can be copied or
captured by the user, and is not anonymized. It is not written to browser storage,
analytics, URLs, or application logs. Framework/provider metadata retention
remains the documented hosting boundary.

Comparison requires a caller to retain responses in its own explicit lifecycle;
the server retains no prior run. Resume Lab retains a bounded set of successful
responses in current React memory only. Its Temporary Revision Workspace keeps
an editable text copy in the same lifecycle and submits it only through an
explicit Run Revision action.

## What v2 enables now

- frontend Evidence Explorer filtering and stable finding selection
- evidence-level TRACE/provenance inspection and Machine View
- finding-ID links from represented terms, review opportunities, and Gap Mode
- Living Report evidence-contract disclosure without changing PDF semantics
- stable finding identity for the bounded, ephemeral Resume Lab comparison design
- temporary-text revision runs whose evidence offsets target exactly the submitted
  temporary representation, never the original uploaded file
- exact occurrence reconstruction in server tests and clients that possess the
  identical canonical text
- full canonical Resume and Job Description X-Ray, exact scanner overlays,
  source switching, keyboard evidence navigation, and shared TRACE selection
- section-aware disassembly when conservative boundaries are returned
- a factual diagnostics explorer with evidence links where available
- truthful machine-readable unknown states

## What remains unavailable by design

- formatting diagnostics: parsers do not expose authoritative layout findings
- requirement severity/readiness diagnostics: no deterministic rule exists
- durable Resume Lab/history: the implemented comparison lifecycle is bounded
  to current React memory and deliberately disappears on clear, refresh, or tab close

The full disclosure and section-model alternatives are documented in
[XRAY_PRIVACY_AND_SECTIONS.md](XRAY_PRIVACY_AND_SECTIONS.md). Full-document
browser disclosure was explicitly approved for the request-scoped block model;
semantic sections and diagnostics were implemented only after their independent
parser-contract gate.

The frontend must not infer these missing facts from filenames, offsets, labels,
layout, or prose.
