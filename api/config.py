"""Environment-derived API configuration with safe local defaults."""

from __future__ import annotations

import os


DEFAULT_ALLOWED_ORIGINS = ("http://localhost:3000", "http://127.0.0.1:3000")


def allowed_origins() -> list[str]:
    """Return explicit CORS origins without accepting wildcard credentials."""
    configured = os.getenv("RESUME_SCREENER_ALLOWED_ORIGINS", "")
    origins = [origin.strip() for origin in configured.split(",") if origin.strip()]
    return origins or list(DEFAULT_ALLOWED_ORIGINS)
