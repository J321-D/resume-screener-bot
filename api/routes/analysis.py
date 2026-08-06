"""Multipart lexical-analysis endpoint."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile

from api.schemas import AnalysisResponse
from api.services.analysis_service import analyze_documents
from api.services.document_service import prepare_documents
from resume_screener.models import AnalysisMode


router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    analysis_mode: Annotated[AnalysisMode, Form()] = AnalysisMode.SKILLS_FOCUSED,
    resume_text: Annotated[str, Form()] = "",
    job_description_text: Annotated[str, Form()] = "",
    resumes: Annotated[list[UploadFile] | None, File()] = None,
    job_description_file: Annotated[UploadFile | None, File()] = None,
) -> AnalysisResponse:
    documents = await prepare_documents(
        resumes or [],
        job_description_file,
        resume_text,
        job_description_text,
    )
    return analyze_documents(documents, analysis_mode)
