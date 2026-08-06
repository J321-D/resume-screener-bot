# Contributing

Read [../AGENTS.md](../AGENTS.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [VERIFICATION.md](VERIFICATION.md) before changing code.

## Setup

Requirements:

- Python 3.9 or newer
- Node.js 24
- pnpm 11

```bash
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt

cd frontend
pnpm install --frozen-lockfile
```

Do not commit environment files, credentials, résumé content, generated output, caches, or dependency directories.

## Run locally

Start the API and frontend in separate terminals:

```bash
./venv/bin/python -m uvicorn api.main:app --reload --port 8000
```

```bash
cd frontend
pnpm dev
```

The Streamlit compatibility interface remains available with:

```bash
./venv/bin/python -m streamlit run app.py
```

## Coding conventions

- Keep the Python engine authoritative and deterministic.
- Do not calculate or reorder analysis results in the client.
- Use typed boundary models and concise public errors.
- Preserve existing input precedence, aggregation, and report semantics.
- Follow the intent in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for UI work.
- Add focused tests for changed behavior and retain characterization coverage.

Protected changes and dependencies require approval before implementation.

## Testing

Run the complete checklist in [VERIFICATION.md](VERIFICATION.md). At minimum, a change must pass its targeted tests, the relevant Python or frontend suite, type checking, lint, build, `pip check`, and `git diff --check`.

## Pull requests

A pull request should:

- state the problem and bounded solution;
- list behavior intentionally changed and preserved;
- identify protected components and contract impact;
- include test commands and results;
- include desktop/mobile evidence for visual changes;
- disclose new dependencies, privacy impact, limitations, and follow-up work;
- update [ROADMAP.md](ROADMAP.md), [DECISIONS.md](DECISIONS.md), or [CHANGELOG.md](CHANGELOG.md) when applicable.

Keep generated files and unrelated refactors out of the diff.

## Commits

Use concise imperative messages with a conventional scope when useful, for example:

```text
feat(frontend): add review workspace
fix(api): preserve upload error contract
docs: document release verification
```

Commits, tags, pushes, and deployments require explicit approval. Before committing, inspect the exact staged file list and staged diff summary.
