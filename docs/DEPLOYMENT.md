# Public Version 2 Deployment

Version 2 is available as a public release candidate with the FastAPI boundary on
Render and the Next.js client on Vercel. The Streamlit v1.1.2 deployment remains
online as the legacy demo and rollback interface, although its provider access
policy may require Streamlit authentication.

## Current public status

- Public frontend: `https://resume-keyword-screener.vercel.app`
- Vercel Production deployment: `dpl_BHCdDRhRCyBbWLR31sn5sSPVJFff`, Ready,
  promoted from verified commit `ff3f75bfd8c28051a0d5a1cd104a6cbda31e363a`
- Render API: `https://resume-keyword-screener-api-preview.onrender.com`
- Render service: `srv-d9qjaciju40c73bc2ptg`, Free plan, automatic deploys off
- CORS: exact public Vercel origin only; no wildcard
- Persistence: none
- Legacy demo: `https://resume-keyword-screener.streamlit.app`, unchanged

Hosted verification covered both analysis modes, uploads, ordered results, all
four review statuses, filters and search, stale-input clearing, Markdown and PDF
downloads, structured errors, provider-log privacy, and 1440 px/390 px responsive
layouts without horizontal overflow. Preview and raw deployment URLs remain
access-protected; the permanent public alias is unauthenticated.

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
RESUME_SCREENER_ALLOWED_ORIGINS=https://resume-keyword-screener.vercel.app
```

The value is a comma-separated allowlist when more than one exact HTTPS origin
is needed. Do not use `*`, and do not include paths or a trailing slash. Protected
Preview deployments are not currently allowed to call the API from a browser.

## Vercel frontend

The public Vercel deployment uses these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `frontend` |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Node.js | 24.x |
| Deployment target | Production, promoted from the verified Preview build |

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

The release candidate was created and promoted through separately approved
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
8. Promoted the verified commit without rebuilding from another revision, assigned
   `resume-keyword-screener.vercel.app`, and kept Preview/raw URLs protected.
9. Replaced the Preview CORS origin with the exact public origin and verified both
   preflight and browser-style analysis requests.

Automatic deployment, a custom domain, a GitHub Release, or Streamlit retirement
still require separate explicit approval. The annotated `v2.0.0` tag already
identifies this public release-candidate state.

## Public release-candidate verification

Run the complete commands in [`VERIFICATION.md`](VERIFICATION.md). For the hosted
public release candidate, additionally verify:

```bash
curl --fail --show-error https://resume-keyword-screener-api-preview.onrender.com/api/v1/health
```

Then run one Skills-focused and one Full lexical analysis through the public
frontend, download and open a Unicode PDF, exercise invalid and oversized uploads,
and inspect both provider logs to confirm no document text is emitted.

## Rollback

- Immediate user-facing fallback: use the unchanged Streamlit v1.1.2 legacy demo
  while the Version 2 issue is investigated, after confirming its provider access
  policy is appropriate for the intended users.
- Frontend: reassign `resume-keyword-screener.vercel.app` to the previously
  verified Vercel deployment selected for rollback. Keeping the same public origin
  means the Render CORS value does not need to widen.
- Backend: roll back the existing Render service to its prior successful deploy;
  do not add a second origin or wildcard as a shortcut.
- Access: if the public frontend is taken offline, remove its exact origin from
  `RESUME_SCREENER_ALLOWED_ORIGINS`. Rotate provider credentials only if exposure
  is suspected.
- Repository: deployment configuration can be reverted with a normal follow-up
  commit; do not rewrite published Git history.

Because Version 2 has no persistence, rollback requires no data migration.

## Known release risks

- Render free services can cold-start and may have changing plan limitations.
- Vercel deployment URLs can vary, while CORS intentionally admits only the stable
  public origin.
- Provider platform logs and retention are outside the application's direct
  control and must be reviewed before using real résumé data.
- `NEXT_PUBLIC_API_URL` is build-time configuration; a stale value requires a new
  verified frontend build.
- Browser upload limits do not replace provider request-size or timeout limits.
