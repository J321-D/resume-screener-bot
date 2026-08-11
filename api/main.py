"""FastAPI application exposing the existing deterministic Python engine."""

from __future__ import annotations

from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from api.config import allowed_origins
from api.errors import PublicApiError
from api.middleware import RequestBodyLimitMiddleware
from api.routes.analysis import router as analysis_router
from api.routes.health import router as health_router
from api.routes.reports import router as reports_router
from api.schemas import ErrorDetail, ErrorResponse


app = FastAPI(
    title="Resume Keyword Screener API",
    version="1.0.0",
    description="Private deterministic lexical résumé comparison API.",
)


class SensitiveResponseCacheMiddleware(BaseHTTPMiddleware):
    """Prevent intermediaries and browsers from caching user-derived responses."""

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        response = await call_next(request)
        if request.url.path in {"/api/v1/analyze", "/api/v1/report"}:
            response.headers["Cache-Control"] = "no-store"
        return response


app.add_middleware(SensitiveResponseCacheMiddleware)
app.add_middleware(RequestBodyLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Accept", "Content-Type"],
)


@app.exception_handler(PublicApiError)
async def public_error_handler(
    request: Request,
    error: PublicApiError,
) -> JSONResponse:
    del request
    body = ErrorResponse(
        error=ErrorDetail(code=error.code, message=error.message, field=error.field)
    )
    return JSONResponse(status_code=error.status_code, content=body.model_dump())


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request,
    error: RequestValidationError,
) -> JSONResponse:
    del request
    first_error = error.errors()[0] if error.errors() else {}
    location = first_error.get("loc", ())
    field = str(location[-1]) if location else None
    body = ErrorResponse(
        error=ErrorDetail(
            code="invalid_request",
            message="Check the submitted fields and try again.",
            field=field,
        )
    )
    return JSONResponse(status_code=422, content=body.model_dump())


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, error: Exception) -> JSONResponse:
    del request, error
    request_id = str(uuid4())
    body = ErrorResponse(
        error=ErrorDetail(
            code="internal_error",
            message="The request could not be completed. Try again.",
            request_id=request_id,
        )
    )
    return JSONResponse(status_code=500, content=body.model_dump())


app.include_router(health_router, prefix="/api/v1", tags=["health"])
app.include_router(analysis_router, prefix="/api/v1", tags=["analysis"])
app.include_router(reports_router, prefix="/api/v1", tags=["reports"])
