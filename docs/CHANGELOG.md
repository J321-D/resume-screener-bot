# Changelog

All notable changes are documented here. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions and uses semantic versioning where releases are published.

## [Unreleased]

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

### Version 2 local milestone — complete, unreleased

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
