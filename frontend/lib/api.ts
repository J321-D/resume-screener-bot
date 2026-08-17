import { analysisResponseSchema, analysisV2ResponseSchema, analysisViewModel, type AnalysisInputs, type AnalysisViewModel, type PublicError } from "./contracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const REQUEST_TIMEOUT_MS = 45_000;
export const SLOW_REQUEST_NOTICE_MS = 6_000;

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
  if (response.status === 429) {
    return {
      code: "service_busy",
      message: "The analysis service is receiving too many requests. Wait a moment and retry.",
    };
  }
  if ([502, 503, 504].includes(response.status)) {
    return {
      code: "service_unavailable",
      message: "The analysis service is temporarily unavailable. Your inputs are still available; retry in a moment.",
    };
  }
  return { code: "request_failed", message: "The request could not be completed. Try again." };
}

async function request(
  path: string,
  options: RequestInit,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(abort, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal });
  } catch {
    if (controller.signal.aborted) {
      if (signal?.aborted) throw new DOMException("Request aborted", "AbortError");
      throw {
        code: "request_timeout",
        message: "The analysis service took too long to respond. Retry in a moment.",
      } satisfies PublicError;
    }
    throw {
      code: "network_error",
      message: "The analysis service is unavailable. Check your connection and retry.",
    } satisfies PublicError;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export async function analyze(inputs: AnalysisInputs, signal?: AbortSignal): Promise<AnalysisViewModel> {
  const response = await request("/api/v2/analyze", {
    method: "POST",
    body: buildAnalysisForm(inputs),
  }, signal);
  if (!response.ok) throw await publicError(response);
  try {
    const payload: unknown = await response.json();
    const v2 = analysisV2ResponseSchema.safeParse(payload);
    if (v2.success) return analysisViewModel(v2.data);
    const v1 = analysisResponseSchema.safeParse(payload);
    if (v1.success) return analysisViewModel(v1.data);
    throw new Error("invalid schema");
  } catch {
    throw {
      code: "invalid_response",
      message: "The analysis service returned an unexpected response. Retry in a moment.",
    } satisfies PublicError;
  }
}

export async function createReport(inputs: AnalysisInputs, signal?: AbortSignal): Promise<Blob> {
  const response = await request("/api/v1/report", {
    method: "POST",
    body: buildAnalysisForm(inputs),
  }, signal);
  if (!response.ok) throw await publicError(response);
  if (!response.headers.get("content-type")?.toLowerCase().startsWith("application/pdf")) {
    throw {
      code: "invalid_response",
      message: "The report service returned an unexpected response. Try the download again.",
    } satisfies PublicError;
  }
  return response.blob();
}
