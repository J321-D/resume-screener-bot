"""Request-boundary protections that run before multipart parsing."""

from __future__ import annotations

import json
from tempfile import SpooledTemporaryFile

from starlette.types import ASGIApp, Message, Receive, Scope, Send


MAX_REQUEST_BODY_BYTES = 28 * 1024 * 1024
_REPLAY_CHUNK_BYTES = 1024 * 1024
_LIMITED_PATHS = {"/api/v1/analyze", "/api/v1/report", "/api/v2/analyze"}


async def _send_error(send: Send, status: int, code: str, message: str) -> None:
    body = json.dumps({"error": {"code": code, "message": message}}).encode()
    await send(
        {
            "type": "http.response.start",
            "status": status,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode()),
                (b"cache-control", b"no-store"),
            ],
        }
    )
    await send({"type": "http.response.body", "body": body})


class RequestBodyLimitMiddleware:
    """Reject oversized analysis bodies before Starlette parses multipart data.

    The bounded spool keeps chunked requests from growing memory without limit and
    is closed as soon as the downstream request finishes.
    """

    def __init__(self, app: ASGIApp, max_body_bytes: int = MAX_REQUEST_BODY_BYTES):
        self.app = app
        self.max_body_bytes = max_body_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope.get("path") not in _LIMITED_PATHS:
            await self.app(scope, receive, send)
            return

        headers = dict(scope.get("headers", []))
        content_length = headers.get(b"content-length")
        if content_length is not None:
            try:
                declared_length = int(content_length)
            except ValueError:
                await _send_error(
                    send, 400, "invalid_content_length", "The request size is invalid."
                )
                return
            if declared_length < 0:
                await _send_error(
                    send, 400, "invalid_content_length", "The request size is invalid."
                )
                return
            if declared_length > self.max_body_bytes:
                await _send_error(
                    send,
                    413,
                    "request_body_too_large",
                    "The complete request body must be 28 MB or smaller.",
                )
                return

        with SpooledTemporaryFile(max_size=_REPLAY_CHUNK_BYTES) as body:
            total = 0
            while True:
                message = await receive()
                if message["type"] == "http.disconnect":
                    return
                chunk = message.get("body", b"")
                total += len(chunk)
                if total > self.max_body_bytes:
                    await _send_error(
                        send,
                        413,
                        "request_body_too_large",
                        "The complete request body must be 28 MB or smaller.",
                    )
                    return
                body.write(chunk)
                if not message.get("more_body", False):
                    break

            body.seek(0)
            replayed = 0

            async def replay() -> Message:
                nonlocal replayed
                chunk = body.read(_REPLAY_CHUNK_BYTES)
                replayed += len(chunk)
                return {
                    "type": "http.request",
                    "body": chunk,
                    "more_body": replayed < total,
                }

            await self.app(scope, replay, send)
