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

function jsonResponse(payload = response, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  }));
}

describe("Analyzer", () => {
  it("starts disabled and becomes ready with pasted inputs", async () => {
    const user = userEvent.setup();
    render(<Analyzer />);
    const button = screen.getByRole("button", { name: /run keyword scan/i });

    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText("Résumé text"), "QC Python");
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText("Job-description text"), "quality control Python SQL");
    expect(button).toBeEnabled();
  });

  it("renders successful analysis, focuses its results region, and scrolls it into view", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockImplementation(() => jsonResponse());
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "QC Python");
    await user.type(screen.getByLabelText("Job-description text"), "quality control Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));

    expect(await screen.findByRole("heading", { name: "Your lexical coverage map" })).toBeInTheDocument();
    const results = screen.getByRole("region", { name: "Your lexical coverage map" });
    expect(results).toHaveAttribute("tabindex", "-1");
    expect(results).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(screen.getByRole("img", { name: "66.7% keyword coverage" })).toBeInTheDocument();
    expect(screen.getAllByText("quality control").length).toBeGreaterThan(0);
    expect(screen.getByText("CATEGORIZED GAPS")).toBeInTheDocument();
    expect(screen.getByText("Coverage opportunities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download pdf report/i })).toBeEnabled();
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

    const list = await screen.findByRole("list", { name: "Coverage opportunities" });
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(
      missingTerms.slice(0, 12).map((item) => item.term),
    );
    expect(screen.queryByText("term-13")).not.toBeInTheDocument();

    const disclosure = screen.getByRole("button", { name: "Show 8 more" });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    disclosure.focus();
    await user.keyboard("{Enter}");
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(
      missingTerms.map((item) => item.term),
    );

    await user.click(screen.getByRole("button", { name: "Show fewer" }));
    await waitFor(() => expect(screen.queryByText("term-13")).not.toBeInTheDocument());
  });

  it("shows truthful request progress while the API is pending", async () => {
    const user = userEvent.setup();
    let resolveRequest!: (value: Response) => void;
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: /run keyword scan/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Analyzing language");
    expect(screen.getByRole("button", { name: /analyzing/i })).toBeDisabled();
    resolveRequest(await jsonResponse());
    expect(await screen.findByText("Results ready")).toBeInTheDocument();
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
});
