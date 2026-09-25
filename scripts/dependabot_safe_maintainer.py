#!/usr/bin/env python3
"""GitHub-native, fail-closed Dependabot maintainer for Resume Screener.

This script is designed to run from the trusted default branch via workflow_run.
It never checks out or executes pull-request code with write credentials.

Allowed autonomous path:
- Dependabot author only.
- Application/library dependencies: same-major update, with major >= 1,
  changing only dependency manifest/lock files.
- Trusted GitHub Actions runtime dependencies may cross major versions only when
  the full base/head workflow content proves every changed line is exactly the
  allowlisted action's immutable uses: SHA pin and that SHA resolves from the
  official new version tag.
- Exact workflow-run head must equal the current PR head.
- PR base must be the current main SHA before merge.
- Every check run on the PR head must be completed and green.
- Required Verify jobs "python" and "frontend" must both be present and green.
- At most one failed Verify rerun per exact head SHA.
- Stale safe PRs receive one idempotent @dependabot rebase request.
- Merge uses the exact tested head SHA.

Everything else fails closed.
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import subprocess
from dataclasses import dataclass
from typing import Any

ALLOWED_FILES = {
    "requirements.txt",
    "frontend/package.json",
    "frontend/pnpm-lock.yaml",
    "frontend/pnpm-workspace.yaml",
}
TRUSTED_ACTIONS = {
    "actions/checkout",
    "actions/setup-node",
    "actions/setup-python",
    "pnpm/action-setup",
}
TRUSTED_WORKFLOW_FILES = {
    ".github/workflows/verify.yml",
    ".github/workflows/safe-dependabot-maintainer.yml",
}
ACTION_USE_RE = re.compile(
    r"^(\s*-\s*uses:\s*)([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)@"
    r"([0-9a-f]{40})(\s+#\s+v?([0-9]+(?:\.[0-9]+){0,3}))?\s*$"
)
GOOD_CONCLUSIONS = {"success", "neutral", "skipped"}
REQUIRED_VERIFY_JOBS = {"python", "frontend"}
DEPENDABOT_LOGINS = {"dependabot[bot]", "app/dependabot", "dependabot"}


class Refused(RuntimeError):
    """A fail-closed policy refusal."""


@dataclass(frozen=True)
class Candidate:
    number: int
    title: str
    head_sha: str
    base_sha: str
    base_ref: str
    author: str
    draft: bool
    mergeable: bool | None
    mergeable_state: str
    files: tuple[str, ...]


def _run(argv: list[str], *, timeout: int = 60) -> str:
    p = subprocess.run(
        argv,
        capture_output=True,
        text=True,
        timeout=timeout,
        check=False,
    )
    if p.returncode:
        raise RuntimeError((p.stderr or p.stdout or "command failed")[-3000:])
    return p.stdout


def _gh_json(args: list[str]) -> Any:
    return json.loads(_run(["gh", *args]))


def version_pair(title: str) -> tuple[str, str] | None:
    m = re.search(
        r"\bfrom\s+v?(\d+(?:\.\d+){1,3})\s+to\s+v?(\d+(?:\.\d+){1,3})\b",
        title,
        re.I,
    )
    if m:
        return m.group(1), m.group(2)

    # Dependabot pip range titles, e.g.
    # "from <4,>=3.9 to >=3.11.2,<4"
    m = re.search(
        r"\bfrom\b.*?>=\s*(\d+(?:\.\d+){1,3}).*?\bto\b.*?>=\s*(\d+(?:\.\d+){1,3})",
        title,
        re.I,
    )
    return (m.group(1), m.group(2)) if m else None


def same_major_safe(title: str) -> bool:
    pair = version_pair(title)
    if not pair:
        return False
    try:
        old_major = int(pair[0].split(".")[0])
        new_major = int(pair[1].split(".")[0])
    except ValueError:
        return False
    return old_major >= 1 and old_major == new_major


def files_safe(paths: tuple[str, ...] | list[str]) -> bool:
    p = set(paths)
    return bool(p) and p <= ALLOWED_FILES


def action_dependency_name(title: str) -> str | None:
    m = re.search(
        r"\b(?:bump|update)\s+([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)\b",
        title,
        re.I,
    )
    return m.group(1).lower() if m else None


def _file_text(repo: str, path: str, ref: str) -> str:
    doc = _gh_json(["api", f"repos/{repo}/contents/{path}?ref={ref}"])
    if doc.get("encoding") != "base64" or not doc.get("content"):
        raise Refused(f"unable to verify full workflow content for {path}")
    try:
        return base64.b64decode(doc["content"]).decode("utf-8")
    except (ValueError, UnicodeDecodeError) as exc:
        raise Refused(f"unable to decode workflow content for {path}") from exc


def _resolve_tag_sha(action_repo: str, version: str) -> str:
    obj = _gh_json(
        ["api", f"repos/{action_repo}/git/ref/tags/v{version}"]
    ).get("object") or {}
    for _ in range(4):
        kind = str(obj.get("type") or "")
        sha = str(obj.get("sha") or "")
        if not sha:
            break
        if kind == "commit":
            return sha
        if kind != "tag":
            break
        obj = _gh_json(["api", f"repos/{action_repo}/git/tags/{sha}"]).get(
            "object"
        ) or {}
    raise Refused(
        f"unable to resolve official v{version} tag for {action_repo}"
    )


def trusted_action_update_safe(repo: str, candidate: "Candidate") -> bool:
    dep = action_dependency_name(candidate.title)
    pair = version_pair(candidate.title)
    if dep not in TRUSTED_ACTIONS or not pair:
        return False
    try:
        old_major = int(pair[0].split(".")[0])
        new_major = int(pair[1].split(".")[0])
    except ValueError:
        return False
    if old_major < 1 or new_major < 1:
        return False

    paths = set(candidate.files)
    if not paths or not paths <= TRUSTED_WORKFLOW_FILES:
        return False

    expected_sha = _resolve_tag_sha(dep, pair[1])
    changed = 0
    for path in sorted(paths):
        before = _file_text(repo, path, candidate.base_sha).splitlines()
        after = _file_text(repo, path, candidate.head_sha).splitlines()
        if len(before) != len(after):
            return False
        for old_line, new_line in zip(before, after):
            if old_line == new_line:
                continue
            old = ACTION_USE_RE.fullmatch(old_line)
            new = ACTION_USE_RE.fullmatch(new_line)
            if not old or not new:
                return False
            if old.group(1) != new.group(1):
                return False
            if old.group(2).lower() != dep or new.group(2).lower() != dep:
                return False
            if new.group(3) != expected_sha:
                return False
            version_comment = new.group(5)
            if version_comment not in {pair[1], str(new_major)}:
                return False
            changed += 1
    return changed > 0


def _repo() -> str:
    repo = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if not repo or "/" not in repo:
        raise Refused("GITHUB_REPOSITORY is unavailable")
    return repo


def load_workflow_run(repo: str, run_id: int) -> dict:
    return _gh_json(["api", f"repos/{repo}/actions/runs/{run_id}"])


def load_candidate(repo: str, run: dict) -> Candidate:
    if run.get("event") != "pull_request":
        raise Refused("Verify run was not triggered by a pull request")

    prs = run.get("pull_requests") or []
    if len(prs) != 1:
        raise Refused("workflow run must map to exactly one pull request")

    number = int(prs[0]["number"])
    pr = _gh_json(["api", f"repos/{repo}/pulls/{number}"])
    head_sha = str(pr.get("head", {}).get("sha") or "")
    run_head = str(run.get("head_sha") or "")
    if not head_sha or head_sha != run_head:
        raise Refused("workflow-run head is not the current PR head")

    files_doc = _gh_json(
        ["api", f"repos/{repo}/pulls/{number}/files?per_page=100"]
    )
    paths = tuple(str(x.get("filename") or "") for x in files_doc)

    return Candidate(
        number=number,
        title=str(pr.get("title") or ""),
        head_sha=head_sha,
        base_sha=str(pr.get("base", {}).get("sha") or ""),
        base_ref=str(pr.get("base", {}).get("ref") or ""),
        author=str(pr.get("user", {}).get("login") or "").lower(),
        draft=bool(pr.get("draft")),
        mergeable=pr.get("mergeable"),
        mergeable_state=str(pr.get("mergeable_state") or "").lower(),
        files=paths,
    )


def validate_candidate(repo: str, candidate: Candidate) -> None:
    if candidate.author not in DEPENDABOT_LOGINS:
        raise Refused("pull request is not authored by Dependabot")
    if candidate.draft:
        raise Refused("draft pull requests are not eligible")
    if candidate.base_ref != "main":
        raise Refused("pull request does not target main")

    if same_major_safe(candidate.title) and files_safe(candidate.files):
        return

    if trusted_action_update_safe(repo, candidate):
        return

    if not same_major_safe(candidate.title):
        raise Refused(
            "major, pre-1.0, or unparseable update outside the trusted-action lane"
        )
    raise Refused("pull request changes unexpected files")


def current_main_sha(repo: str) -> str:
    return str(_gh_json(["api", f"repos/{repo}/commits/main"])["sha"])


def check_runs(repo: str, sha: str) -> list[dict]:
    doc = _gh_json(
        [
            "api",
            "-H",
            "Accept: application/vnd.github+json",
            f"repos/{repo}/commits/{sha}/check-runs?per_page=100",
        ]
    )
    return list(doc.get("check_runs") or [])


def checks_green(rows: list[dict]) -> bool:
    if not rows:
        return False

    names = set()
    for row in rows:
        name = str(row.get("name") or "")
        status = str(row.get("status") or "").lower()
        conclusion = str(row.get("conclusion") or "").lower()
        if status != "completed" or conclusion not in GOOD_CONCLUSIONS:
            return False
        if name:
            names.add(name)

    return REQUIRED_VERIFY_JOBS <= names


def _comments(repo: str, number: int) -> list[dict]:
    return list(
        _gh_json(
            ["api", f"repos/{repo}/issues/{number}/comments?per_page=100"]
        )
    )


def _has_marker(comments: list[dict], marker: str) -> bool:
    return any(marker in str(x.get("body") or "") for x in comments)


def _comment(repo: str, number: int, body: str) -> None:
    _run(
        [
            "gh",
            "api",
            "-X",
            "POST",
            f"repos/{repo}/issues/{number}/comments",
            "-f",
            f"body={body}",
        ]
    )


def request_rebase(repo: str, candidate: Candidate, main_sha: str) -> dict:
    marker = f"<!-- pj-safe-dep-rebase:{candidate.head_sha}:{main_sha} -->"
    comments = _comments(repo, candidate.number)
    if _has_marker(comments, marker):
        return {"action": "REBASE_ALREADY_REQUESTED", "pr": candidate.number}

    _comment(
        repo,
        candidate.number,
        f"{marker}\n@dependabot rebase\n\n"
        "Project Jeffrey safe-maintenance gate: main moved after this head was "
        "tested. Rebase and rerun Verify before any merge.",
    )
    return {"action": "REBASE_REQUESTED", "pr": candidate.number}


def bounded_retry(
    repo: str, candidate: Candidate, run_id: int
) -> dict:
    marker = f"<!-- pj-safe-dep-rerun:{candidate.head_sha} -->"
    comments = _comments(repo, candidate.number)
    if _has_marker(comments, marker):
        return {
            "action": "BLOCKED_AFTER_BOUNDED_RETRY",
            "pr": candidate.number,
            "head_sha": candidate.head_sha,
        }

    _comment(
        repo,
        candidate.number,
        f"{marker}\nProject Jeffrey safe-maintenance gate: retrying the failed "
        "Verify jobs once for this exact head SHA. A second failure will remain "
        "blocked for review.",
    )
    _run(
        [
            "gh",
            "api",
            "-X",
            "POST",
            f"repos/{repo}/actions/runs/{run_id}/rerun-failed-jobs",
        ]
    )
    return {
        "action": "RERUN_FAILED_JOBS",
        "pr": candidate.number,
        "head_sha": candidate.head_sha,
        "run_id": run_id,
    }


def merge(repo: str, candidate: Candidate) -> dict:
    if candidate.mergeable is not True:
        raise Refused("GitHub does not report the pull request as mergeable")
    if candidate.mergeable_state not in {"clean", "has_hooks"}:
        raise Refused(f"unsafe mergeable_state={candidate.mergeable_state or 'unknown'}")

    doc = _gh_json(
        [
            "api",
            "-X",
            "PUT",
            f"repos/{repo}/pulls/{candidate.number}/merge",
            "-f",
            f"sha={candidate.head_sha}",
            "-f",
            "merge_method=squash",
        ]
    )
    if not doc.get("merged"):
        raise Refused(str(doc.get("message") or "GitHub refused merge"))
    return {
        "action": "MERGED",
        "pr": candidate.number,
        "head_sha": candidate.head_sha,
        "merge_sha": doc.get("sha"),
    }


def run(run_id: int, *, execute: bool) -> dict:
    repo = _repo()
    workflow_run = load_workflow_run(repo, run_id)
    candidate = load_candidate(repo, workflow_run)
    validate_candidate(repo, candidate)

    main_sha = current_main_sha(repo)
    conclusion = str(workflow_run.get("conclusion") or "").lower()

    if candidate.base_sha != main_sha:
        if not execute:
            return {
                "action": "WOULD_REQUEST_REBASE",
                "pr": candidate.number,
                "head_sha": candidate.head_sha,
                "main_sha": main_sha,
            }
        return request_rebase(repo, candidate, main_sha)

    if conclusion != "success":
        if not execute:
            return {
                "action": "WOULD_BOUNDED_RETRY",
                "pr": candidate.number,
                "head_sha": candidate.head_sha,
                "run_id": run_id,
            }
        return bounded_retry(repo, candidate, run_id)

    rows = check_runs(repo, candidate.head_sha)
    if not checks_green(rows):
        raise Refused("not every PR-head check is completed and green")

    if not execute:
        return {
            "action": "WOULD_MERGE",
            "pr": candidate.number,
            "head_sha": candidate.head_sha,
        }
    return merge(repo, candidate)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--workflow-run-id", type=int, required=True)
    ap.add_argument("--execute", action="store_true")
    args = ap.parse_args()

    try:
        result = run(args.workflow_run_id, execute=args.execute)
    except Refused as exc:
        print(json.dumps({"status": "REFUSED", "reason": str(exc)}, sort_keys=True))
        return 0
    except Exception as exc:
        print(
            json.dumps(
                {
                    "status": "ERROR",
                    "error": f"{type(exc).__name__}: {str(exc)[:1200]}",
                },
                sort_keys=True,
            )
        )
        return 1

    print(json.dumps({"status": "OK", **result}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
