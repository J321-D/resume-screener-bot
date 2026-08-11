"""Synthetic, read-only integration smoke for an already deployed release."""

from __future__ import annotations

import argparse

import httpx


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frontend", default="https://resume-keyword-screener.vercel.app")
    parser.add_argument("--api", default="https://resume-keyword-screener-api-preview.onrender.com")
    arguments = parser.parse_args()

    with httpx.Client(timeout=60, follow_redirects=True) as client:
        for path in ("/", "/methodology", "/privacy", "/help"):
            response = client.get(f"{arguments.frontend}{path}")
            response.raise_for_status()

        health = client.get(f"{arguments.api}/api/v1/health")
        health.raise_for_status()
        assert health.json()["status"] == "ok"

        lexical = client.post(
            f"{arguments.api}/api/v1/analyze",
            data={
                "analysis_mode": "Full lexical analysis",
                "resume_text": "Python SQL",
                "job_description_text": "Python SQL MATLAB",
            },
        )
        lexical.raise_for_status()
        assert lexical.json()["coverage"]["score"] == 66.7
        assert lexical.headers.get("cache-control") == "no-store"

        focused = client.post(
            f"{arguments.api}/api/v1/analyze",
            data={
                "analysis_mode": "Skills-focused analysis",
                "resume_text": "QC Python",
                "job_description_text": "quality control Python SQL",
            },
        )
        focused.raise_for_status()
        assert focused.json()["analysis_mode"] == "Skills-focused analysis"

        cors = client.options(
            f"{arguments.api}/api/v1/analyze",
            headers={
                "Origin": arguments.frontend,
                "Access-Control-Request-Method": "POST",
            },
        )
        cors.raise_for_status()
        assert cors.headers.get("access-control-allow-origin") == arguments.frontend

    print("Synthetic public smoke passed.")


if __name__ == "__main__":
    main()
