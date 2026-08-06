import { analysisResponseSchema, type AnalysisInputs, type AnalysisResponse, type PublicError } from "./contracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function buildAnalysisForm(inputs: AnalysisInputs): FormData {
  const form = new FormData();
  form.set("analysis_mode", inputs.analysisMode);
  form.set("resume_text", inputs.resumeText);
  form.set("job_description_text", inputs.jobText);
  inputs.resumeFiles.forEach((file) => form.append("resumes", file));
  if (inputs.jobFile) form.set("job_description_file", inputs.jobFile);
  return form;
}

async function publicError(response: Response): Promise<PublicError> {
  try {
    const payload = await response.json();
    if (payload?.error?.message) return payload.error as PublicError;
  } catch {
    // A generic message is safer than exposing transport internals.
  }
  return { code: "request_failed", message: "The request could not be completed. Try again." };
}

export async function analyze(inputs: AnalysisInputs, signal?: AbortSignal): Promise<AnalysisResponse> {
  const response = await fetch(`${API_URL}/api/v1/analyze`, {
    method: "POST",
    body: buildAnalysisForm(inputs),
    signal,
  });
  if (!response.ok) throw await publicError(response);
  return analysisResponseSchema.parse(await response.json());
}

export async function createReport(inputs: AnalysisInputs): Promise<Blob> {
  const response = await fetch(`${API_URL}/api/v1/report`, {
    method: "POST",
    body: buildAnalysisForm(inputs),
  });
  if (!response.ok) throw await publicError(response);
  return response.blob();
}
