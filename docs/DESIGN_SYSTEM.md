# Design System

## Principles

The interface should feel like precise professional software: calm, technical, private, and trustworthy. Visual polish must improve comprehension rather than imply intelligence or hiring authority.

## Typography

- Display text establishes one clear page or results focal point.
- Headings describe task hierarchy, not marketing claims.
- Body text is concise and readable at comfortable line lengths.
- Captions and metadata remain secondary but meet contrast requirements.
- Monospaced text is reserved for technical labels, statuses, and compact metadata.

## Spacing and layout

Use a consistent spacing rhythm and a centered content grid. Related controls belong together; major workflow stages need deliberate separation. Desktop may use two balanced input columns. Narrow layouts stack without changing task order.

The implementation uses semantic tokens for spacing, surfaces, borders,
elevation, focus, motion, and layering. Layer values are limited to content,
sticky navigation, and the responsive menu; arbitrary high z-index values are
not part of the system.

## Card hierarchy

1. Coverage summary: strongest scale and visual emphasis
2. Matched terms and coverage opportunities: medium emphasis and fast scanning
3. Category coverage: quieter analytical support
4. Normalization explanations: collapsed supporting detail
5. Export: compact closing action

Avoid giving every panel identical size, surface, and border weight.

## Color roles

- Cyan: primary action, focus, and core lexical coverage
- Emerald or mint: matched terms, privacy, and successful states
- Amber: coverage opportunities and cautions
- Violet: restrained atmospheric depth
- Red: actual errors only
- Neutral surfaces: structure, hierarchy, and readable contrast

Meaning must never depend on color alone.

## Motion

Motion confirms state and guides attention. Shared fast, standard, and emphasis
durations use one controlled easing curve. Hover feedback is brief; result cards
resolve with restrained opacity/translation, and the coverage arc settles while
the exact score text is available immediately. Low-intensity ambient motion is
limited to the original analysis core; count-up scores, fake percentage
progress, flashing, pointer-dependent interactions, and scroll hijacking are excluded.
Reduced-motion users receive the same information with negligible transition.

## Accessibility

- Use semantic landmarks and heading order.
- Associate labels and errors with controls.
- Preserve keyboard access and visible focus.
- Announce loading, errors, and result readiness appropriately.
- Use disclosure semantics for collapsed lists.
- Maintain readable contrast and touch targets.

## Hero

The hero introduces privacy and lexical purpose through an original five-segment
analysis core. A CSS-first boot resolves grid, trace, copy, core, and actions in
about 1.3 seconds; subtle orbit/particle motion may continue afterward. The core
reacts only to real idle, input-ready, processing, and results states and contains
no fake score, count, terminal, or proprietary/cinematic imitation. Copy and the
real workflow remain dominant. Reduced motion renders the complete composition
immediately without delayed hidden content.

## Coverage dashboard

Coverage is the results centerpiece. The score, ring, and supporting counts communicate lexical overlap only. Use neutral labels such as “Keyword Coverage” and “Coverage Opportunities”; never infer candidate quality.

The deterministic analysis fingerprint and paired category blueprint may make
returned distributions easier to recognize, but must always retain their textual
count fallback and explicit non-assessment label. Overview, Standard, and Dense
change information density without changing or persisting analysis state.

The result system map provides user-controlled walkthrough choreography across
existing regions; it never simulates engine stages. Living Report is a screen-only
reading view of the same ordered response and does not replace or modify the
protected PDF. Showcase and Precision Lab are session-only presentation modes.
The opt-in performance HUD uses local Navigation Timing and returned counts only.

The procedural hero field is a bounded ambient layer, not a primary visualization:
18 deterministic nodes, a 20 fps ceiling, visibility pausing, capped pixel ratio,
and a static reduced-motion state. Walkthrough selection may optically emphasize
the corresponding existing region but never hides content or morphs returned values.

## Progressive disclosure

Long ordered lists show a useful initial subset and disclose the remaining count. Expansion preserves exact engine order, provides “Show more” and “Show fewer” controls, and remains usable by keyboard and assistive technology.

## Review workspace

Opportunity review is a focused editing workflow, not a survey or ranking system. Present one compact decision control per term, retain engine order, and keep progress and status totals factual. Use cyan for Add to résumé, emerald for Already represented, neutral treatment for Not relevant, and amber for Review later. Filters and search may narrow the view but never rerank it. Reset requires explicit confirmation, and stale analyses expose no prior decisions.

Category and term focus may narrow visible matched evidence, opportunities, and
review rows without recalculating coverage or discarding decisions. Evidence
labels are limited to exact lexical or engine-returned normalized matches.
Command-K/Control-K exposes only actions available in the current DOM. Review
rows support Arrow movement, Enter inspection, and labeled 1–4 decisions.

Gap Mode isolates one unresolved returned opportunity while preserving the same
decision controls and engine order. The Mission Board reports only user workflow
completion. Session notes are visibly labeled local and ephemeral; resolved-item
choreography must never imply that the analysis score changed.

Evidence Intelligence is a secondary technical instrument, not a replacement
for the primary review flow. Its list/inspector split collapses vertically on
narrow screens; status color is always paired with text. TRACE motion is a
short continuity cue removed under reduced motion. Machine View uses native
disclosure semantics, every filter keeps a visible label, and forced colors
retain borders and focus. The evidence instrument is omitted from print because
the protected PDF remains the authoritative portable report.

Section-aware X-Ray defaults to separated canonical section modules only when
the API returns exact boundaries; raw canonical text remains available. The
diagnostics rail groups actual per-request rules into Document, Structure, and
Coverage, pairs every state with text, and never uses the development-test count
or an invented severity. Comparison printing isolates the existing factual Diff
Reactor record and removes interactive controls.

## Assistance system

Help is task-oriented rather than an accordion wall. Search, category filters,
deep links, contextual result links, troubleshooting, glossary definitions, and
synthetic examples share the same information hierarchy. No-results states offer
a direct reset. Feedback links disclose that GitHub is external and forbid
document or personal data. Assistance must never imply AI, coaching, candidate
assessment, templates, or a persistent support channel.

## Responsive behavior

The same workflow must remain clear at desktop, tablet, and mobile widths. Preserve score prominence, natural chip wrapping, compact export actions, usable navigation, and zero horizontal overflow. Validate the breakpoint matrix in [VERIFICATION.md](VERIFICATION.md).

## Native and fallback behavior

Real terms remain selectable, searchable text rather than canvas output. Native
file, textarea, select, print, focus, and clipboard semantics are preserved and
progressively enhanced. Forced-colors and print rules remove decorative
dependency; `prefers-reduced-motion` disables nonessential motion. Focus rings
must remain visible around clipped or rounded surfaces, and user-controlled
filenames/terms use bidi isolation and overflow-safe layout.
