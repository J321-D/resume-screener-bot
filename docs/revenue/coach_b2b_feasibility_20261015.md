# B2B coach workflow feasibility — synthetic-only research

**As-of:** 2026-10-15 (public-page observations, not publication dates)
**Status:** VALIDATING; no paid customers or demand interviews verified.
**Operating constraint:** $0 spend. No outreach, uploads, client processing, payment links, subscriptions, or production contract changes.

## Testable question

Can the current deterministic lexical engine generate **separate, repeatable reports for several synthetic clients** without changing existing scoring, exposing document contents, adding a database, or presenting candidate-quality rankings? If yes, a career-coach review workflow might merit a consent-first customer interview later, but does not establish a commercial market.

The offline exploratory code `scripts/coach_portfolio_feasibility.py` is **not** a deployed or saleable batch feature. It calls the existing immutable `resume_screener.analysis` engine once per entirely fabricated input. It does not merge client word sets, alter public API behavior, keep résumés, make hiring predictions, or deliver reports to users.

## Current public-market anchors

1. [Jobscan Coach](https://www.jobscan.co/coach) visibly targets career coaches, organizations and client accounts; its [published tutorial](https://www.jobscan.co/jobscan-coach-tutorial) advertises **$99/month** or $999/year and client slots. Observation is a competitor offer, not independently verified sales.
2. [Resume Worded business plans](https://resumeworded.com/business-plans-checkout) list **$149/month billed yearly** for Essentials (Coaches); **$199/month billed yearly** for resume writers with up to 15 white-labeled reviews; and $329/month billed yearly for up to 60. These are competitor list prices, not net revenue benchmarks.
3. [Resume Worded coach-license help](https://help.resumeworded.com/article/26-start-career-coach-plan) describes resume/LinkedIn optimization and sharing reports for coaches and students; the [Jobscan Coach](https://www.jobscan.co/coach) page describes client analytics and multi-seat plans. These are product-positioning signals, **not dated actual customer demand**, independent subscriptions, or conversions.

**Unresolved evidence:** interviews or user permissions, actual willingness to pay for *this* product, a qualified differentiated feature, legal/privacy suitability, coach workflow time saved, unit costs, acquisition channels and recurring payments. Until these are demonstrated, the commercial result is **$0 verified MRR**.

## Reproducible zero-spend technical check

```bash
python3 -m unittest tests.test_coach_portfolio_feasibility -v
python3 scripts/coach_portfolio_feasibility.py
```

Output uses opaque synthetic case labels, term coverage, missing terms, model metadata and explicit research-only provenance. The score means **unique lexical token coverage**, not résumé quality, success likelihood, customer value or ATS pass rate.

## Honest decision gate

- **Technical pass:** reproducible synthetic-only per-case lexical result, complete tests, no input retention and no changes to the protected engine.
- **Market evidence gate:** at least three independently identifiable dated demand signals or future authorized customer interviews, differentiated value relative to published competitor offers, and unit economics. Current competitor pages alone do **not** clear that gate.
- **Commercial activation:** no payment link, outreach, customer onboarding, storage, real client data or production marketing without a separate approved decision. Do not count mock receipts, paper trading or list prices toward revenue.
- **Goal context:** $3,000/month is **verified net recurring income target**; gross offer math is not net income. Product pricing and number of customers are hypotheses until measured.

## Next evidence task

Evaluate a more explicit coaching workflow in a non-production branch, then obtain separate approval to test a concise offer with consenting career professionals. A rejection is a valid experiment outcome if actual use cases or willingness to pay are unsupported.
