"""Validated server-side PDF report endpoint."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response
from starlette.concurrency import run_in_threadpool

from api.services.document_service import prepare_documents
from api.services.report_service import generate_report_for_documents
from resume_screener.models import AnalysisMode


router = APIRouter()


@router.post("/report", response_class=Response)
async def report(
    analysis_mode: Annotated[AnalysisMode, Form()] = AnalysisMode.SKILLS_FOCUSED,
    resume_text: Annotated[str, Form()] = "",
    job_description_text: Annotated[str, Form()] = "",
    resumes: Annotated[list[UploadFile] | None, File()] = None,
    job_description_file: Annotated[UploadFile | None, File()] = None,
) -> Response:
    documents = await prepare_documents(
        resumes or [],
        job_description_file,
        resume_text,
        job_description_text,
    )
    pdf_bytes = await run_in_threadpool(
        generate_report_for_documents, documents, analysis_mode
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="resume-keyword-report.pdf"',
            "Cache-Control": "no-store",
        },
    )
