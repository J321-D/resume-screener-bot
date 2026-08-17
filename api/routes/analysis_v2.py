"""Version 2 analysis route with additive deterministic provenance."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile
from starlette.concurrency import run_in_threadpool

from api.schemas_v2 import AnalysisV2Response
from api.services.analysis_service import analyze_documents
from api.services.document_service import prepare_documents
from api.services.evidence_service import build_v2_response
from resume_screener.models import AnalysisMode


router = APIRouter()


@router.post("/analyze", response_model=AnalysisV2Response)
async def analyze_v2(
    analysis_mode: Annotated[AnalysisMode, Form()] = AnalysisMode.SKILLS_FOCUSED,
    resume_text: Annotated[str, Form()] = "",
    job_description_text: Annotated[str, Form()] = "",
    resumes: Annotated[list[UploadFile] | None, File()] = None,
    job_description_file: Annotated[UploadFile | None, File()] = None,
) -> AnalysisV2Response:
    documents = await prepare_documents(
        resumes or [],
        job_description_file,
        resume_text,
        job_description_text,
    )
    analysis = await run_in_threadpool(analyze_documents, documents, analysis_mode)
    return await run_in_threadpool(
        build_v2_response,
        documents,
        analysis_mode,
        analysis,
    )
