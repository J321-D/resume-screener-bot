"""Environment-derived API configuration with safe local defaults."""

from __future__ import annotations

import os
from urllib.parse import urlsplit


DEFAULT_ALLOWED_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")


def allowed_origins() -> list[str]:
    """Return explicit CORS origins without accepting wildcard credentials."""
    configured = os.getenv("RESUME_SCREENER_ALLOWED_ORIGINS", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    if not origins:
        return list(DEFAULT_ALLOWED_ORIGINS)

    validated: list[str] = []
    for origin in origins:
        parsed = urlsplit(origin)
        if (
            origin == "*"
            or parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path not in {"", "/"}
            or parsed.query
            or parsed.fragment
            or origin.endswith("/")
        ):
            raise RuntimeError(
                "RESUME_SCREENER_ALLOWED_ORIGINS must contain exact HTTP(S) origins."
            )
        if origin not in validated:
            validated.append(origin)
    return validated
