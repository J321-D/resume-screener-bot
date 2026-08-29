import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Analyzer } from "@/components/analysis/analyzer";

const response = {
  analysis_mode: "Skills-focused analysis",
  coverage: { score: 66.7, matched: 2, missing: 1, total: 3, label: "Categorized Keyword Coverage" },
  matched_terms: [
    { term: "quality control", count: 1, category: "Quality/regulatory" },
    { term: "Python", count: 1, category: "Tools/software" },
  ],
  missing_terms: [{ term: "SQL", count: 1, category: "Tools/software" }],
  categories: [
    { category: "Tools/software", matched: 1, total: 2, score: 50, display_value: "50.0%", included_in_primary: true },
    { category: "Uncategorized", matched: 0, total: 0, score: null, display_value: "N/A — no applicable concepts", included_in_primary: false },
  ],
  normalized_matches: [{ concept: "quality control", resume_term: "QC", job_term: "quality control" }],
  metadata: { resume_label: "Pasted résumé", resume_count: 1, input_mode: "pasted_text", analyzed_at: "2026-08-06T16:00:00Z" },
  warnings: [],
};

function v2Response(sqlStatus: "matched" | "missing") {
  const matched = sqlStatus === "matched";
  const analysis = {
    ...response,
    coverage: { ...response.coverage, score: matched ? 100 : 66.7, matched: matched ? 3 : 2, missing: matched ? 0 : 1 },
    matched_terms: matched ? [...response.matched_terms, { term: "SQL", count: 1, category: "Tools/software" }] : response.matched_terms,
    missing_terms: matched ? [] : response.missing_terms,
  };
  return {
    contract_version: "2.0",
    analysis,
    source_documents: [],
    findings: [{ finding_id: `finding-sql-${sqlStatus}`, comparison_key: "skills_focused.concept_coverage:sql", rule_id: "skills_focused.concept_coverage", category: "Tools/software", status: sqlStatus, reason: matched ? "exact_match" : "not_detected", display_term: "SQL", normalized_term: "sql", match_method: matched ? "exact" : "not_detected", evidence: [], unavailable_evidence_reason: matched ? null : "not_detected" }],
  };
}

function jsonResponse(payload: unknown = response, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  }));
}

describe("Analyzer", () => {
  it("loads and clears the isolated synthetic demo without retaining URL content", async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, "", "/?demo=1#workspace");
    render(<Analyzer />);

    expect(await screen.findByText("Synthetic demo loaded.")).toBeInTheDocument();
    expect((screen.getByLabelText("Résumé text") as HTMLTextAreaElement).value).toContain("Bioprocess engineer");
    expect((screen.getByLabelText("Job-description text") as HTMLTextAreaElement).value).toContain("MATLAB");
    expect(window.location.search).toBe("");

    await user.click(screen.getByRole("button", { name: "Clear demo" }));
    expect(screen.getByLabelText("Résumé text")).toHaveValue("");
    expect(screen.getByLabelText("Job-description text")).toHaveValue("");
    expect(screen.queryByText("Synthetic demo loaded.")).not.toBeInTheDocument();
    window.history.replaceState({}, "", "/");
  });

  it("loads cinematic demo inputs without automatically submitting them", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    window.history.replaceState({}, "", "/?demo=cinematic#workspace");
    render(<Analyzer />);
    expect(await screen.findByText("Synthetic demo loaded.")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-presentation", "active");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /run keyword scan/i })).toBeEnabled();
    window.history.replaceState({}, "", "/");
    delete document.documentElement.dataset.presentation;
  });

  it("starts disabled and becomes ready with pasted inputs", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);
    const button = screen.getByRole("button", { name: /run keyword scan/i });

    expect(button).toBeDisabled();
    expect(screen.getByLabelText("Document analysis state")).toHaveTextContent("Awaiting input");
    await user.type(screen.getByLabelText("Résumé text"), "QC Python");
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText("Job-description text"), "quality control Python SQL");
    expect(button).toBeEnabled();
    expect(screen.getByLabelText("Document analysis state")).toHaveTextContent("Pasted text");
    await waitFor(() => expect(document.documentElement).toHaveAttribute("data-analysis-state", "input_ready"));
  });

  it("renders successful analysis, focuses its results region, and scrolls it into view", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse());
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "QC Python");
    await user.type(screen.getByLabelText("Job-description text"), "quality control Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));

    expect(await screen.findByRole("heading", { name: "Your lexical coverage map" }, { timeout: 3_000 })).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "Your lexical coverage map" });
    expect(results).toHaveAttribute("tabindex", "-1");
    expect(results).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(screen.getByRole("img", { name: "66.7% categorized keyword coverage" })).toBeInTheDocument();
    expect(screen.getAllByText("quality control").length).toBeGreaterThan(0);
    expect(screen.getByText("CATEGORIZED GAPS")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Curated concepts to review",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Uncategorized lexical coverage")).toBeInTheDocument();
    expect(screen.getByText("N/A — no applicable concepts")).toBeInTheDocument();
    expect(screen.getByText(/excluded from the primary categorized score/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Analysis fingerprint" })).toBeInTheDocument();
    expect(screen.getByText("1 represented / 2 requested")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "standard" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "dense" }));
    expect(screen.getByRole("region", { name: "Your lexical coverage map" })).toHaveClass("density-dense");
    expect(screen.getByRole("button", { name: /download pdf report/i })).toBeEnabled();
    expect(screen.getByText("Normalized match")).toBeInTheDocument();
    expect(screen.getByText("Exact lexical match")).toBeInTheDocument();
    const matrix = screen.getByRole("table", { name: /résumé representation and coverage opportunities/i });
    expect(within(matrix).getByText("Tools/software")).toBeInTheDocument();
    expect(within(matrix).getByText("50.0%")).toBeInTheDocument();
    expect(within(matrix).getAllByText("1")).toHaveLength(2);
  });

  it("retains successful reruns in Resume Lab and compares v2 findings", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => jsonResponse(v2Response("missing")))
      .mockImplementationOnce(() => jsonResponse(v2Response("matched")));
    render(<Analyzer />);
    await user.type(screen.getByLabelText("Résumé text"), "QC Python");
    await user.type(screen.getByLabelText("Job-description text"), "quality control Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    expect(await screen.findByRole("heading", { name: "Resume Lab" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Résumé text"), " SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    expect(await screen.findByText("2 / 5 runs")).toBeInTheDocument();
    expect(screen.getAllByText("Newly represented")).toHaveLength(2);
  });

  it("runs a temporary revision only on explicit submission and retains its source type", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => jsonResponse(v2Response("missing")))
      .mockImplementationOnce(() => jsonResponse(v2Response("matched")));
    render(<Analyzer />);
    await user.type(screen.getByLabelText("Résumé text"), "QC Python");
    await user.type(screen.getByLabelText("Job-description text"), "quality control Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    await screen.findByRole("heading", { name: "Resume Lab" });

    const editor = screen.getByRole("textbox", { name: "Temporary résumé revision" });
    await user.type(editor, " SQL");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Résumé text")).toHaveValue("QC Python");

    await user.click(screen.getByRole("button", { name: "Run Revision" }));
    expect(await screen.findByText(/Revision run completed/)).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const revisionForm = fetchSpy.mock.calls[1]?.[1]?.body as FormData;
    expect(revisionForm.get("resume_text")).toBe("QC Python SQL");
    expect(revisionForm.getAll("resumes")).toHaveLength(0);
    expect(screen.getByLabelText("Résumé text")).toHaveValue("QC Python SQL");
    expect(screen.getAllByText(/temporary text revision/i).length).toBeGreaterThan(1);
    expect(screen.getAllByText("Newly represented")).toHaveLength(2);
  });

  it("focuses category and term evidence without changing coverage or review decisions", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse({
      ...response,
      missing_terms: [
        { term: "SQL", count: 2, category: "Tools/software" },
        { term: "GMP", count: 1, category: "Quality/regulatory" },
      ],
      categories: [
        { category: "Tools/software", matched: 1, total: 2, score: 50, display_value: "50.0%", included_in_primary: true },
        { category: "Quality/regulatory", matched: 1, total: 2, score: 50, display_value: "50.0%", included_in_primary: true },
      ],
    }));
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "QC Python");
    await user.type(screen.getByLabelText("Job-description text"), "quality control Python SQL GMP");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    await screen.findByRole("heading", { name: "Your lexical coverage map" });

    await user.click(screen.getByRole("button", { name: /Tools\/software.*50\.0%/i }));
    expect(screen.getByRole("complementary", { name: "Focused evidence view" })).toHaveTextContent("Category evidence isolated");
    expect(within(screen.getByRole("list", { name: "Curated concepts to review" })).getByText("SQL", { exact: true })).toBeInTheDocument();
    await waitFor(() => expect(within(screen.getByRole("list", { name: "Curated concepts to review" })).queryByText("GMP", { exact: true })).not.toBeInTheDocument());
    await waitFor(() => expect(within(screen.getByLabelText("Opportunity review list")).getAllByRole("article")).toHaveLength(1));

    await user.selectOptions(screen.getByLabelText("Review status for SQL"), "add");
    await user.click(screen.getByRole("button", { name: "Clear focus" }));
    expect(screen.getByLabelText("Review status for SQL")).toHaveValue("add");
    expect(screen.getByLabelText("Review status for GMP")).toBeInTheDocument();

    await user.click(within(screen.getByRole("list", { name: "Curated concepts to review" })).getByRole("button", { name: "GMP" }));
    expect(screen.getByRole("complementary", { name: "Focused evidence view" })).toHaveTextContent("GMP");
    await waitFor(() => expect(within(screen.getByLabelText("Opportunity review list")).getAllByRole("article")).toHaveLength(1));
    expect(screen.getByLabelText("Review status for GMP")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "66.7% categorized keyword coverage" })).toBeInTheDocument();

    const matrix = screen.getByRole("table", { name: /résumé representation and coverage opportunities/i });
    await user.click(within(matrix).getByRole("button", { name: "Tools/software" }));
    expect(screen.getByRole("complementary", { name: "Focused evidence view" })).toHaveTextContent("Tools/software");
  });

  it("preserves engine order while progressively disclosing long opportunity lists", async () => {
    const user = userEvent.setup();
    const missingTerms = Array.from({ length: 20 }, (_, index) => ({
      term: `term-${String(index + 1).padStart(2, "0")}`,
      count: 20 - index,
      category: "Technical skills",
    }));
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse({
      ...response,
      missing_terms: missingTerms,
    }));
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));

    const list = await screen.findByRole("list", { name: "Curated concepts to review" });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(
      missingTerms.slice(0, 12).map((item) => item.term),
    );
    expect(within(list).queryByText("term-13")).not.toBeInTheDocument();

    const disclosure = screen.getByRole("button", { name: "Show 8 more" });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    disclosure.focus();
    await user.keyboard("{Enter}");
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(
      missingTerms.map((item) => item.term),
    );

    await user.click(screen.getByRole("button", { name: "Show fewer" }));
    await waitFor(() => expect(within(list).queryByText("term-13")).not.toBeInTheDocument());
  });

  it("shows truthful request progress while the API is pending", async () => {
    const user = userEvent.setup();
    let resolveRequest!: (value: Response) => void;
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));

    const timeline = screen.getByRole("status", { name: "Analysis status: Deterministic analysis" });
    expect(timeline).toHaveTextContent("Input snapshot");
    expect(timeline).toHaveTextContent("Deterministic analysis");
    expect(timeline).toHaveTextContent("Results assembled");
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(3);
    expect(document.documentElement).toHaveAttribute("data-analysis-state", "processing");
    expect(screen.getByRole("button", { name: /analyzing/i })).toBeDisabled();
    resolveRequest(await jsonResponse());
    expect(await screen.findByRole("status", { name: "Analysis status: Results assembled" })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("data-analysis-state", "results");
  });

  it("marks results stale and disables export when inputs change", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse());
    render(<Analyzer />);

    const resume = screen.getByLabelText("Résumé text");
    await user.type(resume, "QC Python");
    await user.type(screen.getByLabelText("Job-description text"), "quality control Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    await screen.findByRole("heading", { name: "Your lexical coverage map" });

    await user.selectOptions(screen.getByLabelText("Review status for SQL"), "add");
    expect(screen.getByText("1 of 1")).toBeInTheDocument();

    await user.type(resume, " MATLAB");
    expect(screen.getByText(/inputs changed after this scan/i)).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Analysis status: Results assembled" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf report/i })).toBeDisabled();
    expect(screen.getByText(/review decisions were cleared/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Review status for SQL")).toHaveValue("");
    expect(screen.getByLabelText("Review status for SQL")).toBeDisabled();
    expect(screen.getByRole("button", { name: /download markdown checklist/i })).toBeDisabled();
  });

  it("shows structured API errors without exposing a stack trace", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse({
      error: { code: "malformed_pdf", message: "The PDF is corrupted.", field: "resumes", request_id: null },
    } as never, 422));
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("The PDF is corrupted."));
    expect(document.body).not.toHaveTextContent("Traceback");
    expect(screen.queryByRole("region", { name: "Your lexical coverage map" })).not.toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
  });

  it("cancels a pending request without clearing current inputs", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, init) => new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Analysis canceled");
    expect(screen.getByLabelText("Résumé text")).toHaveValue("Python");
    expect(screen.getByLabelText("Job-description text")).toHaveValue("Python SQL");
    expect(screen.getByRole("button", { name: /run keyword scan/i })).toBeEnabled();
  });

  it("retries a failed request with the preserved current inputs", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => jsonResponse({ error: { code: "service_unavailable", message: "Service unavailable." } } as never, 503))
      .mockImplementationOnce(() => jsonResponse());
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable.");

    await user.click(screen.getByRole("button", { name: "Retry analysis" }));
    expect(await screen.findByRole("heading", { name: "Your lexical coverage map" })).toBeInTheDocument();
    expect(screen.getByLabelText("Résumé text")).toHaveValue("Python");
  });

  it("keeps a canceled request from overwriting a newer analysis", async () => {
    const user = userEvent.setup();
    let firstReject!: (reason: unknown) => void;
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce((_url, init) => new Promise((_, reject) => {
        firstReject = reject;
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }))
      .mockImplementationOnce(() => jsonResponse({
        ...response,
        matched_terms: [{ term: "MATLAB", count: 1, category: "Tools/software" }],
      }));
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.clear(screen.getByLabelText("Résumé text"));
    await user.type(screen.getByLabelText("Résumé text"), "MATLAB");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));

    expect(await screen.findByText("MATLAB", { selector: ".term-name" })).toBeInTheDocument();
    firstReject(new Error("late first response"));
    expect(screen.getByText("MATLAB", { selector: ".term-name" })).toBeInTheDocument();
  });

  it("requires confirmation before clearing a completed current-session analysis", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse());
    render(<Analyzer />);
    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    await screen.findByRole("heading", { name: "Your lexical coverage map" });

    await user.click(screen.getByRole("button", { name: "New analysis" }));
    const clearButton = screen.getByRole("button", { name: "Clear and start new" });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(clearButton).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.getByRole("button", { name: "New analysis" })).toHaveFocus());
    expect(screen.getByLabelText("Résumé text")).toHaveValue("Python");
    await user.click(screen.getByRole("button", { name: "New analysis" }));
    await user.click(screen.getByRole("button", { name: "Clear and start new" }));
    expect(screen.getByLabelText("Résumé text")).toHaveValue("");
    expect(screen.queryByRole("heading", { name: "Your lexical coverage map" })).not.toBeInTheDocument();
  });

  it("shows report failures beside export without clearing successful results", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => jsonResponse())
      .mockResolvedValueOnce(new Response("upstream unavailable", { status: 503 }));
    render(<Analyzer />);
    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    await screen.findByRole("heading", { name: "Your lexical coverage map" });

    await user.click(screen.getByRole("button", { name: /download pdf report/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("PDF report not created");
    expect(screen.getByRole("alert")).toHaveTextContent("temporarily unavailable");
    expect(screen.getByRole("heading", { name: "Your lexical coverage map" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf report/i })).toBeEnabled();
  });

  it("offers a native print action without changing the current analysis", async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse());
    render(<Analyzer />);
    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    await screen.findByRole("heading", { name: "Your lexical coverage map" });

    await user.click(screen.getByRole("button", { name: "Print results" }));

    expect(print).toHaveBeenCalledOnce();
    expect(screen.getByRole("heading", { name: "Your lexical coverage map" })).toBeInTheDocument();
  });

  it("aborts an in-flight report when New analysis purges the session", async () => {
    const user = userEvent.setup();
    let reportAborted = false;
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => jsonResponse())
      .mockImplementationOnce((_url, init) => new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reportAborted = true;
          reject(new DOMException("Aborted", "AbortError"));
        });
      }));
    render(<Analyzer />);
    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));
    await screen.findByRole("heading", { name: "Your lexical coverage map" });
    await user.click(screen.getByRole("button", { name: /download pdf report/i }));

    await user.click(screen.getByRole("button", { name: "New analysis" }));
    await user.click(screen.getByRole("button", { name: "Clear and start new" }));

    expect(reportAborted).toBe(true);
    expect(screen.queryByRole("heading", { name: "Your lexical coverage map" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("validates empty and oversized files before submission", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);
    const input = screen.getByLabelText("Résumé files");
    await user.upload(input, new File([], "empty.txt", { type: "text/plain" }));
    expect(screen.getByRole("alert")).toHaveTextContent("empty.txt is empty");
    expect(screen.getByText("0 B · Empty file")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run keyword scan/i })).toBeDisabled();
  });

  it("labels unsupported files as invalid instead of ready to scan", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<Analyzer />);

    await user.upload(
      screen.getByLabelText("Résumé files"),
      new File(["synthetic fixture"], "resume.exe", { type: "application/octet-stream" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("resume.exe must be a PDF, DOCX, or TXT file");
    expect(screen.getByText("17 B · Unsupported file type")).toBeInTheDocument();
    expect(screen.queryByText(/17 B · Ready to scan/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run keyword scan/i })).toBeDisabled();
  });

  it("allows the same document to be selected again after removal", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);
    const input = screen.getByLabelText("Résumé files");
    const file = new File(["Python"], "resume.txt", { type: "text/plain" });

    await user.upload(input, file);
    await user.click(screen.getByRole("button", { name: "Remove resume.txt" }));
    expect(screen.queryByText("resume.txt")).not.toBeInTheDocument();

    await user.upload(input, file);
    expect(screen.getByText("resume.txt")).toBeInTheDocument();
    expect(screen.getByText("6 B · Ready to scan")).toBeInTheDocument();
  });
});
