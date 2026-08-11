import { afterEach, describe, expect, it, vi } from "vitest";

import { analyze, createReport, REQUEST_TIMEOUT_MS } from "@/lib/api";
import type { AnalysisInputs } from "@/lib/contracts";

const inputs: AnalysisInputs = {
  analysisMode: "Skills-focused analysis",
  resumeFiles: [],
  resumeText: "Python",
  jobFile: null,
  jobText: "Python SQL",
};

function abortablePendingRequest(init?: RequestInit): Promise<Response> {
  return new Promise((_, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });
}

describe("API request resilience", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns a stable timeout error after the bounded request interval", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => abortablePendingRequest(init));

    const request = analyze(inputs);
    const assertion = expect(request).rejects.toEqual({
      code: "request_timeout",
      message: "The analysis service took too long to respond. Retry in a moment.",
    });
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
    await assertion;
  });

  it("preserves caller cancellation as an AbortError", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => abortablePendingRequest(init));
    const controller = new AbortController();
    const request = analyze(inputs, controller.signal);

    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });

  it("maps malformed analysis payloads to a stable public error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ unexpected: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    await expect(analyze(inputs)).rejects.toEqual({
      code: "invalid_response",
      message: "The analysis service returned an unexpected response. Retry in a moment.",
    });
  });

  it("rejects a successful report response with a non-PDF content type", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("not a report", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    }));

    await expect(createReport(inputs)).rejects.toEqual({
      code: "invalid_response",
      message: "The report service returned an unexpected response. Try the download again.",
    });
  });

  it.each([
    [429, "service_busy", "too many requests"],
    [502, "service_unavailable", "temporarily unavailable"],
    [503, "service_unavailable", "temporarily unavailable"],
    [504, "service_unavailable", "temporarily unavailable"],
  ])("maps generic provider status %i to actionable public copy", async (status, code, message) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("provider response", { status }));

    await expect(analyze(inputs)).rejects.toMatchObject({ code, message: expect.stringContaining(message) });
  });

  it("allows report requests to be canceled by the caller", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => abortablePendingRequest(init));
    const controller = new AbortController();
    const request = createReport(inputs, controller.signal);

    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });
});
