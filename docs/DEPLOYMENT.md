# Public V2.x Deployment

Version 2 is available as a public release with the FastAPI boundary on
Render and the Next.js client on Vercel. The Streamlit v1.1.2 deployment remains
online as the legacy demo and fallback interface, although its provider access
policy may require Streamlit authentication.

## Current public status

- Public frontend: `https://resume-keyword-screener.vercel.app`
- Release commit: `e8e638b971e94f2156e61c3e33e31ccbc00e159d`
- Successful CI: [GitHub Actions run 31532357547](https://github.com/J321-D/resume-screener-bot/actions/runs/31532357547)
- Vercel project: `resume-screener-bot-preview`
  (`prj_S2zBCRSYQ0IUeT7JpNlZ8OjmvsyX`), team `j321-ds-projects`, Hobby plan
- Vercel Production: `dpl_4MfeNJ49N6ZaepmDioXKTwKWZyqR`, Ready, target
  `production`, exact release commit, deployment URL
  `https://resume-screener-bot-preview-ep6jorcvg-j321-ds-projects.vercel.app`
- Protected Preview: `dpl_2Tv7zUQy1bqJPpMmtT4M1QQcPU3E`, Ready, target
  `preview`, exact release commit, stable alias
  `https://resume-screener-bot-preview-j321-d-j321-ds-projects.vercel.app`,
  deployment URL
  `https://resume-screener-bot-preview-aaafzpxga-j321-ds-projects.vercel.app`
- Render API: `https://resume-keyword-screener-api-preview.onrender.com`
- Render service: `srv-d9qjaciju40c73bc2ptg`, Free plan, automatic deploys off
- Render deploy: `dep-d9toon2jobas73dhap7g`, live at the exact release commit
  after the approved environment update; underlying exact-code deploy
  `dep-d9toh71t0dsc73bq0cp0`
- CORS: exact public Production and stable protected Preview origins; no wildcard
- Vercel Web Analytics: active on Hobby for `/`, `/methodology`, and `/privacy`;
  no custom events
- Persistence: none
- Legacy demo: `https://resume-keyword-screener.streamlit.app`, unchanged

Hosted verification covered both analysis modes, uploads, ordered results, all
four review statuses, filters and search, stale-input clearing, Markdown and PDF
downloads, structured errors, provider-log privacy, and 1440 px/390 px responsive
layouts without horizontal overflow. Production is canonical and indexable;
Preview and raw deployment URLs remain access-protected and noindex; the
permanent public alias is unauthenticated.

## Release-closure evidence — 2026-08-11

- The public alias returned HTTP 200 and resolved to the exact Production
  deployment and release commit. Its canonical URL, `robots.txt`, and sitemap
  identify only public Production routes.
- The stable Preview alias returned a Vercel SSO redirect and resolved to the
  exact Preview deployment and release commit; its deployment-specific response
  included `x-robots-tag: noindex`.
- Render health returned HTTP 200. Synthetic Skills-focused and Full lexical
  requests both returned the documented 66.7% result for `Python SQL` versus
  `Python SQL MATLAB`; structured errors remained private and `no-store`.
- PDF report generation returned HTTP 200, `application/pdf`, `no-store`, and
  valid `%PDF-` bytes.
- Browser-style preflight accepted only the exact public and stable protected
  Preview origins. Deployment-specific, unrelated, wildcard, and `null` origins
  received no allow-origin grant.
- Vercel Analytics showed active standard page-view collection for `/`,
  `/methodology`, and `/privacy` and explicitly reported no custom events. Counts
  are intentionally not treated as a release invariant.
- The immediate frontend rollback deployment
  `dpl_14mo7BYpmkTchqfHi1ojMSBxZ3iH` remained Ready and returned HTTP 200 through
  authenticated Vercel access without moving the public alias.

## Deployment topology

```text
Browser
  │ HTTPS
  ▼
Vercel: frontend/ (Next.js)
  │ multipart HTTPS
  ▼
Render: api.main:app (FastAPI)
  │ in-memory request processing
  ▼
Protected deterministic Python engine
```

No database, persistent disk, background worker, or external analysis service is
required. Uploaded documents are validated and processed in memory. The checked-in
Vercel frontend uses enabled anonymous aggregate Web Analytics for three fixed
public paths; it does not send document or form content and defines no custom
interaction events.
Application code does not log document contents, but the hosting providers may
retain request metadata such as timestamps, paths, status codes, IP addresses,
and user agents according to their own logging and retention policies.

## Render backend

The repository-root [`render.yaml`](../render.yaml) defines one Python web
service:

| Setting | Value |
| --- | --- |
| Name | `resume-keyword-screener-api-preview` |
| Runtime | Python |
| Plan | Free |
| Branch | `main` |
| Root directory | `.` |
| Build command | `python -m pip install --upgrade pip && python -m pip install -r requirements.txt` |
| Start command | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/api/v1/health` |
| Automatic deploys | Off |
| Python version | `3.12` from [`.python-version`](../.python-version) |

The running Render service uses this required environment variable:

```text
RESUME_SCREENER_ALLOWED_ORIGINS=https://resume-keyword-screener.vercel.app,https://resume-screener-bot-preview-j321-d-j321-ds-projects.vercel.app
```

The actual value is a single comma-separated line containing those two exact
HTTPS origins. Do not use `*`, and do not include paths or a trailing slash.
Deployment-specific Preview/Production URLs and unrelated origins are denied.

## Vercel frontend

The public Vercel deployment uses these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `frontend` |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Node.js | 24.x |
| Deployment target | Production build from the exact verified release commit |

No `vercel.json` is required: Vercel detects the Next.js framework and the
standard output from the selected root directory. The checked-in
`packageManager` declaration and workspace file pin pnpm 11.16.0. Set:

```text
ENABLE_EXPERIMENTAL_COREPACK=1
NEXT_PUBLIC_API_URL=https://resume-keyword-screener-api-preview.onrender.com
```

`NEXT_PUBLIC_API_URL` is intentionally public and is embedded into the client at
build time. It must contain the Render HTTPS origin with no trailing slash. A
change requires a new frontend build. `ENABLE_EXPERIMENTAL_COREPACK` instructs
Vercel to honor the checked-in package-manager version; it is not a secret.

## Completed release sequence

The release was created and promoted through separately approved
provider actions in this order:

1. Connect the GitHub repository to Render and Vercel.
2. Create the Render Blueprint service without enabling automatic deploys.
3. Set an exact temporary CORS origin, deploy the backend, and verify
   `/api/v1/health` plus private-error behavior.
4. Create the Vercel project with `frontend` as its root, add the two environment
   variables above, and create a Preview deployment.
5. Replace the temporary Render CORS value with the exact assigned Vercel preview
   origin and restart the backend.
6. Verify both analysis modes, upload validation, mobile and desktop layouts, API
   failure handling, stale-result protection, and PDF download through the hosted
   frontend.
7. Kept the Streamlit deployment online.
8. Created one Production-scoped build from the exact verified commit, assigned
   `resume-keyword-screener.vercel.app`, and kept Preview/raw URLs protected.
9. Restored the stable Preview alias to the exact Preview build and allowlisted
   only the public Production and stable protected Preview origins in Render.
10. Enabled standard Hobby Web Analytics, deployed the hardening commit to both
    frontend targets and Render, and reran hosted release verification.

Automatic deployment, a custom domain, a later tag/GitHub Release, or Streamlit
retirement still require separate explicit approval. The annotated `v2.0.0` tag
marks the original public baseline; the current hardening commit is newer and
untagged.

## Public release verification

Run the complete commands in [`VERIFICATION.md`](VERIFICATION.md). For the hosted
public release, additionally verify:

```bash
curl --fail --show-error https://resume-keyword-screener-api-preview.onrender.com/api/v1/health
```

Then run one Skills-focused and one Full lexical analysis through the public
frontend, download and open a Unicode PDF, exercise invalid and oversized uploads,
and inspect both provider logs to confirm no document text is emitted.

## Rollback

Rollback triggers are a persistent frontend failure, health/API contract failure,
failure of either analysis mode or PDF export, confirmed privacy/logging exposure,
an incorrect alias/commit mapping, or a CORS regression. A single free-tier cold
start is not by itself a rollback trigger.

- Immediate user-facing fallback: use the unchanged Streamlit v1.1.2 legacy demo
  while the Version 2 issue is investigated, after confirming its provider access
  policy is appropriate for the intended users.
- Frontend: reassign `resume-keyword-screener.vercel.app` to the READY, previously
  verified deployment `dpl_14mo7BYpmkTchqfHi1ojMSBxZ3iH` at commit
  `ce633cfee4124daa4c253f7b83d9e104608b86ef`. It remains available and returned
  HTTP 200 through authenticated Vercel access during release closure. Keeping
  the same public alias means Render CORS does not need to widen.
- Backend: roll back the existing Render service to its prior successful deploy;
  do not add a second origin or wildcard as a shortcut.
- Access: if the public frontend is taken offline, remove its exact origin from
  `RESUME_SCREENER_ALLOWED_ORIGINS`. Rotate provider credentials only if exposure
  is suspected.
- Repository: deployment configuration can be reverted with a normal follow-up
  commit; do not rewrite published Git history.

Because Version 2 has no persistence, rollback requires no data migration.

## Post-release observation checklist

- Confirm the public alias and stable Preview alias still resolve to their exact
  Production/Preview deployment IDs and targets.
- Check Render health, both synthetic analysis modes, structured errors, and PDF
  bytes; tolerate and record expected Free-plan cold starts.
- Recheck exact Production/Preview CORS and denial of deployment-specific,
  unrelated, wildcard, and `null` origins.
- Review provider errors/latency and confirm application logs do not expose
  document content.
- Confirm Web Analytics remains page-view-only for the three approved paths and
  reports no custom events.
- Confirm the latest GitHub Actions run for the release commit remains green.

## Runtime and browser policy

- Render runs Python 3.12; Vercel builds/runs the frontend with Node 24.x and pnpm
  11.16.0.
- CI validates Python 3.12 plus Playwright Desktop Chrome on Chromium and iPhone
  13 emulation on WebKit.
- Current evergreen Chrome, Edge, Safari, and Firefox are the support target.
  Unavailable manual engines are recorded as coverage limits rather than claimed
  as tested.

## Known release risks

- Render free services can cold-start and may have changing plan limitations.
- Vercel deployment URLs can vary, while CORS intentionally admits only the stable
  public and stable protected Preview origins.
- Provider platform logs and retention are outside the application's direct
  control and must be reviewed before using real résumé data.
- `NEXT_PUBLIC_API_URL` is build-time configuration; a stale value requires a new
  verified frontend build.
- Browser upload limits do not replace provider request-size or timeout limits.
- There is no application/provider rate limiter beyond current provider controls;
  revisit only if abuse, capacity, latency, or cost evidence appears.
- No Content Security Policy is currently shipped. Reevaluate if content/script
  sources expand or a verified nonce/hash policy can be introduced without
  breaking Next.js or Vercel Analytics.
- `pip check` validates dependency compatibility, not Python CVEs. A dedicated
  scanner remains separately gated; Dependabot/provider advisories are the current
  watch path.
- The green GitHub Actions run reports upstream Node 20 action-metadata,
  `punycode`, `url.parse()`, legacy ESLint configuration, and PyMuPDF `fitz`
  deprecation notices. They are non-blocking until a maintained replacement is
  available or a notice becomes a failing/security condition.
- Server parsing has bounded inputs and DOCX archive checks but no hard CPU
  isolation deadline for a pathological document; reevaluate if latency or abuse
  evidence appears.
