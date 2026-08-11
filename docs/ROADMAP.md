# Roadmap and terminal dispositions

The V2.x product program is complete. This document records the terminal state
of previously proposed work so ideas are not silently deferred or accidentally
presented as promises. Evidence links point to the authoritative
[completeness matrix](COMPLETENESS.md).

## Shipped product program

- [x] Preserve the deterministic Python engine and Full lexical compatibility.
- [x] Add the versioned FastAPI boundary and typed browser contract.
- [x] Add the responsive Next.js workflow, premium technical design system, and
  restrained motion language.
- [x] Add Skills-focused and Full lexical workflows, upload/paste precedence,
  ordered results, review decisions, search/filter, copy, Markdown, PDF, and
  print utilities.
- [x] Add synthetic demo/onboarding, responsive navigation, searchable Help,
  Methodology, Privacy, contextual guidance, and transparent limitations.
- [x] Harden file signatures, multipart/body/file/archive/text/extraction bounds,
  stale/race/cancel/retry behavior, no-store responses, exact-origin CORS, and
  private structured errors.
- [x] Add anonymous aggregate Vercel page analytics with fixed public routes,
  no custom events, no form/document data, and non-transmitting local behavior.
- [x] Add Python/API, unit/accessibility, Chromium, Firefox, WebKit/mobile,
  reduced-motion, forced-colors, print, zoom, and responsive verification.
- [x] Publish V2 at the permanent Vercel URL, keep a protected Preview, preserve
  the Streamlit v1.1.2 legacy fallback, and document rollback evidence.
- [x] Add least-privilege CI, weekly dependency review, production smoke tooling,
  security policy, repository operating documentation, and public portfolio assets.

## Intentionally rejected

These are closed product decisions, not an unprioritized backlog:

| Proposal | Terminal reason |
| --- | --- |
| Generative-AI rewriting, coaching, ATS prediction, embeddings, fuzzy matching, or opaque weighting | Conflicts with deterministic explainability, capability-boundary clarity, and the current privacy promise. |
| Approximate source highlighting | The engine does not return occurrence spans; reconstructing them in the client could misattribute a match. |
| Independent candidate ranking or multiple-résumé scoring | Changes the protected résumé-union contract and risks implying candidate assessment. |
| Accounts, saved analyses, histories, collaboration, public sharing, comments, voting, or community Q&A | Requires identity, persistence, retention/deletion, moderation, abuse controls, and a materially different threat model. |
| Persistent in-product feedback collection | Requires storage, identity/consent, moderation, retention, and spam infrastructure. Help instead provides a transparent GitHub issue path with a warning not to include document content or PII. |
| Fake local “Was this helpful?” control | A non-persistent vote would not reach maintainers and would misleadingly imply feedback was received. |
| OCR | Adds heavy document processing and dependencies while changing the accepted input/security boundary; image-only PDFs are rejected clearly. |
| Theme switcher | A second complete accessible visual system adds ongoing contrast and regression cost without demonstrated product value; forced-colors and system accessibility preferences are supported. |
| Motion/animation framework | Native CSS and existing browser APIs provide the restrained transitions required without another runtime dependency. |
| Stateful application rate limiter | Per-instance IP state would be privacy-sensitive and ineffective across free-tier instances; exact bounds and provider controls remain the appropriate current boundary. |
| Speculative Content Security Policy | A nonce/hash rollout across Next.js and Vercel Analytics would add breakage risk without a demonstrated injection path; unsafe user HTML is never rendered. |
| Custom analytics events | Standard aggregate page views answer the accepted usage question without workflow surveillance or a paid-plan expansion. |
| Custom domain | The permanent `vercel.app` URL is clean, stable, and functional; DNS and provider changes add operational surface without product value. |
| Streamlit retirement | It remains a useful independent v1.1.2 compatibility and rollback demo. |

## Externally blocked actions

These items are complete as decisions but cannot be performed as ordinary
repository work:

| Action | Exact blocker |
| --- | --- |
| Stage, commit, push, tag, GitHub Release, or deploy this integrated worktree | Explicit Git/provider authorization gate. |
| Enable Dependabot security updates/alerts or scheduled external monitoring | GitHub/provider write and permissions approval. |
| Dispose of the excluded nested `resume-screener-bot/` repository | Separate destructive scope and ownership decision. |
| Add provider-side rate limiting or paid security controls | Provider configuration and possible billing/privacy decision; no current abuse evidence. |

## Re-evaluation triggers

Rejected decisions reopen only with concrete new evidence: a verified security
defect, measurable abuse/capacity problem, a protected-engine contract proposal,
or a separately approved persistence/identity/provider architecture. Routine
ideas do not extend the completed V2.x release.
