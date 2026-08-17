# Full-document X-Ray privacy and section-model review

This review records the design decision for Resume X-Ray, Job Description X-Ray,
scanner-lens overlays, and the independently gated section-aware parsing model. The
privacy-bounded option 2 document-view model was explicitly approved and is now
implemented. A later milestone approved only conservative, exact section evidence.

## Disclosure options

| Option | Additional response data | Product value | Privacy and security consequence | Lifecycle and compatibility |
| --- | --- | --- | --- | --- |
| 1. Canonical extracted text | Complete canonical résumé and JD strings used by the parser | Direct exact span rendering, accessible full-document X-Ray, scanner lens, and future section overlays | Materially broadens sensitive content in the response and browser memory; increases payload size, copy/screenshot exposure, debugging exposure, and the consequence of a client-side injection. It does not make the data anonymous. | Must remain `no-store`, never enter logs/analytics/URLs/browser storage, clear with analysis state, and be versioned additively. Browser-memory clearing is not secure erasure. Existing v1/v2 consumers can remain compatible through a new optional/versioned field. |
| 2. Safe document-view blocks | Ordered block IDs, exact display text, canonical offset mappings, and evidence relationships | Supports an accessible document view and block-level cross-filtering without exposing parser implementation details | If the complete readable document is represented, disclosure is materially equivalent to option 1 even though parser internals are omitted. Smaller selected blocks would not support a true full-document X-Ray. | Requires deterministic block boundaries and a versioned block contract. The same `no-store`, logging, copy/screenshot, reset, and XSS constraints apply. |
| 3. Server-side X-Ray render model | Preplaced display fragments/blocks, supported overlay types, accessible reading order, and evidence links | Centralizes placement rules and can keep unsupported parser details private | A human-readable full-document render still discloses essentially all source text. A bitmap would reduce accessibility, search/copy, responsiveness, and exact keyboard inspection without materially removing screenshot exposure. | Highest contract complexity and weakest frontend flexibility. Every render primitive and accessibility mapping must be versioned; the server still must not persist it. |

All three options enlarge network payloads and browser-memory exposure.
`Cache-Control: no-store` reduces HTTP caching but does not prevent browser
memory, screenshots, clipboard use, extensions, developer tools, or
provider-level transport metadata. Application logs and error payloads must
continue to omit source text. Any future debug tooling must use synthetic
fixtures. Rendering must use escaped text nodes, not raw HTML; the current CSP
posture would need to be reassessed against the larger consequence surface, not
described as a security guarantee.

## Implemented decision and boundary

Option 2 is the implemented design:
an additive, deterministic, accessible block model with exact mappings back to
the canonical string. It avoids leaking parser internals and creates a truthful
place for future authoritative sections. It does **not** materially reduce
document-content disclosure; that disclosure was explicitly approved for this
request-scoped feature. Option 1 remains less extensible. Option 3 adds complexity
without a corresponding privacy benefit.

The API returns deterministic contiguous blocks that reconstruct exact canonical
text. The UI renders them as escaped React text nodes, overlays represented
evidence only, lists missing findings in a separate gap layer, and shares finding
selection with TRACE. No text enters browser storage. Approximate reconstruction,
inferred surrounding text, and fabricated locations for missing concepts remain
prohibited.

## Implemented section-aware parsing model

Canonical extraction is unchanged. The parser now retains only bounded heading
hints that map exactly back to canonical text: explicit DOCX heading styles,
emphasized PDF text lines, and conservative standalone known headings for text.
The additive contract provides:

- `section_id`, `source_document`, half-open canonical `start`/`end` offsets;
- a normalized `section_type` or explicit `unknown`/`unsupported` state;
- the raw heading when it exists in the canonical representation;
- no confidence field unless a real deterministic confidence model is defined.

The English-first vocabulary is explicit. Repeated sections remain distinct;
embedded prose, heading-like bullets, unmappable metadata, unsupported headings,
and overlaps are rejected. Multi-column reading order remains the canonical PDF
parser order; no original layout is reconstructed. When boundaries are not
reliable, sections remain empty and structure is explicitly `not_detected`.

## Diagnostics decision

The response inventories only mechanically executed request rules: readable text
extraction, section availability, repeated detected section types, the existing
strict 30% review boundary, and returned coverage opportunities. The UI reports
the actual per-request count and links evidence when present. It does not expose
visual-format quality, contact checks, severity, readiness, or the development
test count as user diagnostics.
