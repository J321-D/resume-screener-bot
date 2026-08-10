# Private Preview Deployment

Version 2 has an access-protected release-candidate Preview with the FastAPI
boundary on Render and the Next.js client on Vercel. It has not been promoted,
published, assigned a custom domain, or made the primary application. The
published Streamlit application remains the stable interface.

## Current release-candidate status

- Vercel Preview: `https://resume-screener-bot-preview-ilivb7qjm-j321-ds-projects.vercel.app`
- Vercel deployment: `dpl_9YxJRtCPBoSwbG4bWZ1kXcp7bYTW`, Ready, target `preview`
- Render API: `https://resume-keyword-screener-api-preview.onrender.com`
- Render service: `srv-d9qjaciju40c73bc2ptg`, Free plan, automatic deploys off
- CORS: exact Vercel Preview origin only; no wildcard
- Persistence: none
- Stable public application: existing Streamlit deployment, unchanged

Hosted verification covered both analysis modes, uploads, ordered results, all
four review statuses, filters and search, stale-input clearing, Markdown and PDF
downloads, structured errors, provider-log privacy, and 1440 px/390 px responsive
layouts without horizontal overflow. Provider access protection remains enabled.

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

No database, persistent disk, background worker, external analysis service, or
telemetry provider is required. Uploaded documents are validated and processed
in memory. Application code does not log document contents, but the hosting
providers may retain request metadata such as timestamps, paths, status codes,
IP addresses, and user agents according to their own logging and retention
policies.

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
RESUME_SCREENER_ALLOWED_ORIGINS=https://resume-screener-bot-preview-ilivb7qjm-j321-ds-projects.vercel.app
```

The value is a comma-separated allowlist when more than one exact HTTPS origin
is needed. Do not use `*`, and do not include paths or a trailing slash. A new
Vercel preview URL must be added explicitly before that preview can call the API
from a browser.

## Vercel frontend

The Vercel Preview uses these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `frontend` |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Node.js | 24.x |
| Deployment target | Preview until release approval |

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

## Completed Preview sequence

The private release candidate was created through separately approved provider
actions in this order:

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

Promotion, custom domains, public release, automatic deployment, or Streamlit
replacement still require separate explicit approval.

## Release-candidate verification

Run the complete commands in [`VERIFICATION.md`](VERIFICATION.md). For the hosted
Preview, additionally verify:

```bash
curl --fail --show-error https://resume-keyword-screener-api-preview.onrender.com/api/v1/health
```

Then run one Skills-focused and one Full lexical analysis through the Vercel
preview, download and open a Unicode PDF, exercise invalid and oversized uploads,
and inspect both provider logs to confirm no document text is emitted.

## Rollback

- Frontend: remove or disable the Vercel project/preview alias. The stable
  Streamlit application is unaffected.
- Backend: suspend the Render service or roll back to the prior successful deploy.
- Access: remove the Vercel origin from
  `RESUME_SCREENER_ALLOWED_ORIGINS` and rotate any provider credentials if their
  exposure is suspected.
- Repository: deployment configuration can be reverted with a normal follow-up
  commit; do not rewrite published Git history.

Because Version 2 has no persistence, rollback requires no data migration.

## Known release risks

- Render free services can cold-start and may have changing plan limitations.
- Vercel preview URLs can vary, while CORS intentionally requires exact origins.
- Provider platform logs and retention are outside the application's direct
  control and must be reviewed before using real résumé data.
- `NEXT_PUBLIC_API_URL` is build-time configuration; a stale value requires a
  rebuilt preview.
- Browser upload limits do not replace provider request-size or timeout limits.
