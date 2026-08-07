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

Motion confirms state and guides attention. Hover feedback should be brief; result reveals and coverage animation should settle quickly. Do not add fake delays, constant spectacle, flashing, scroll hijacking, or motion required to understand content. Reduced-motion users receive final values immediately.

## Accessibility

- Use semantic landmarks and heading order.
- Associate labels and errors with controls.
- Preserve keyboard access and visible focus.
- Announce loading, errors, and result readiness appropriately.
- Use disclosure semantics for collapsed lists.
- Maintain readable contrast and touch targets.

## Hero

The hero introduces privacy and lexical purpose. Atmosphere may use restrained depth, technical geometry, and slow ambient movement, but copy remains dominant and credible. Avoid gaming, glitch, fake-terminal, and generic AI imagery.

## Coverage dashboard

Coverage is the results centerpiece. The score, ring, and supporting counts communicate lexical overlap only. Use neutral labels such as “Keyword Coverage” and “Coverage Opportunities”; never infer candidate quality.

## Progressive disclosure

Long ordered lists show a useful initial subset and disclose the remaining count. Expansion preserves exact engine order, provides “Show more” and “Show fewer” controls, and remains usable by keyboard and assistive technology.

## Review workspace

Opportunity review is a focused editing workflow, not a survey or ranking system. Present one compact decision control per term, retain engine order, and keep progress and status totals factual. Use cyan for Add to résumé, emerald for Already represented, neutral treatment for Not relevant, and amber for Review later. Filters and search may narrow the view but never rerank it. Reset requires explicit confirmation, and stale analyses expose no prior decisions.

## Responsive behavior

The same workflow must remain clear at desktop, tablet, and mobile widths. Preserve score prominence, natural chip wrapping, compact export actions, usable navigation, and zero horizontal overflow. Validate the breakpoint matrix in [VERIFICATION.md](VERIFICATION.md).
