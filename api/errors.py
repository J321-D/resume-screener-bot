"""Structured public API errors that never expose document content or traces."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PublicApiError(Exception):
    """An expected request failure safe to return to an API consumer."""

    status_code: int
    code: str
    message: str
    field: str | None = None

    def __str__(self) -> str:
        return self.message
