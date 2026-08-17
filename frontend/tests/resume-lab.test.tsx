import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { ResumeLab } from "@/components/lab/resume-lab";
import type { AnalysisRun } from "@/components/lab/comparison-model";
import type { AnalysisFinding, AnalysisViewModel } from "@/lib/contracts";

function makeRun(id: string, sqlStatus: "matched" | "missing"): AnalysisRun {
  const findings: AnalysisFinding[] = ["python", "sql"].map((term) => ({
    finding_id: `${id}-${term}`,
    comparison_key: `skills_focused.concept_coverage:${term}`,
    rule_id: "skills_focused.concept_coverage",
    category: "Tools/software",
    status: term === "sql" ? sqlStatus : "matched",
    reason: term === "sql" && sqlStatus === "missing" ? "not_detected" : "exact_match",
    display_term: term,
    normalized_term: term,
    match_method: term === "sql" && sqlStatus === "missing" ? "not_detected" : "exact",
    evidence: [],
    unavailable_evidence_reason: term === "sql" && sqlStatus === "missing" ? "not_detected" : null,
  }));
  const matched = findings.filter((finding) => finding.status === "matched").length;
  const analysis: AnalysisViewModel = {
    analysis_mode: "Skills-focused analysis",
    coverage: { score: matched * 50, matched, missing: 2 - matched, total: 2, label: "Categorized Keyword Coverage" },
    matched_terms: findings.filter((finding) => finding.status === "matched").map((finding) => ({ term: finding.display_term, count: 1, category: finding.category })),
    missing_terms: findings.filter((finding) => finding.status === "missing").map((finding) => ({ term: finding.display_term, count: 1, category: finding.category })),
    categories: [{ category: "Tools/software", matched, total: 2, score: matched * 50, display_value: `${matched * 50}.0%`, included_in_primary: true }],
    normalized_matches: [], warnings: [],
    metadata: { resume_label: id, resume_count: 1, input_mode: "pasted_text", analyzed_at: "2026-08-13T12:00:00Z" },
    evidenceContract: { version: "2.0", findings, sourceDocuments: [] },
  };
  return { runId: id, label: id, createdAtClient: "2026-08-13T12:00:00Z", analysis, inputIdentity: id, resumeIdentity: id, jobIdentity: "same-job", reviewState: {}, notes: {}, sourceType: "pasted_text" };
}

const revisionProps = {
  revisionSeed: "Python",
  revisionRunning: false,
  preferredBaselineId: null,
  onRunRevision: vi.fn(async () => true),
};

describe("ResumeLab", () => {
  it("renders bounded session context and inspects authoritative differences", async () => {
    const user = userEvent.setup();
    const onSelectRun = vi.fn();
    render(<ResumeLab {...revisionProps} runs={[makeRun("Baseline", "missing"), makeRun("Current", "matched")]} activeRunId="Current" notice={null} demoAvailable onSelectRun={onSelectRun} onClear={vi.fn()} onLoadDemoVariant={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Resume Lab" })).toBeInTheDocument();
    expect(screen.getAllByText("Newly represented")).toHaveLength(2);
    expect(screen.getByText(/Nothing here is saved/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /sql/i }));
    expect(onSelectRun).toHaveBeenCalledWith("Current", "Current-sql");
  });

  it("keeps scratchpad local and requires confirmation before clearing", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<ResumeLab {...revisionProps} runs={[makeRun("Baseline", "missing")]} activeRunId="Baseline" notice={null} demoAvailable={false} onSelectRun={vi.fn()} onClear={onClear} onLoadDemoVariant={vi.fn()} />);
    await user.type(screen.getByRole("textbox", { name: /Comparison-only scratchpad/i }), "Compare revised wording");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    await user.click(screen.getByRole("button", { name: /Clear Resume Lab session/i }));
    expect(onClear).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Clear in-app session state" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("submits a temporary text revision only after the explicit action", async () => {
    const user = userEvent.setup();
    const onRunRevision = vi.fn(async () => true);
    render(<ResumeLab {...revisionProps} onRunRevision={onRunRevision} runs={[makeRun("Baseline", "missing")]} activeRunId="Baseline" notice={null} demoAvailable={false} onSelectRun={vi.fn()} onClear={vi.fn()} onLoadDemoVariant={vi.fn()} />);
    const editor = screen.getByRole("textbox", { name: /Temporary résumé revision/i });
    expect(editor).toHaveValue("Python");
    await user.type(editor, " SQL");
    expect(onRunRevision).not.toHaveBeenCalled();
    expect(screen.getByText(/Edits here do not modify your uploaded résumé file/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Run Revision" }));
    expect(onRunRevision).toHaveBeenCalledWith("Python SQL", "Baseline");
    expect(await screen.findByText(/Revision run completed/)).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("keeps upload-derived source text unavailable and reports a rejected revision run", async () => {
    const user = userEvent.setup();
    const onRunRevision = vi.fn(async () => false);
    render(<ResumeLab {...revisionProps} revisionSeed="" onRunRevision={onRunRevision} runs={[makeRun("Upload", "missing")]} activeRunId="Upload" notice={null} demoAvailable={false} onSelectRun={vi.fn()} onClear={vi.fn()} onLoadDemoVariant={vi.fn()} />);
    expect(screen.getByText(/uploaded content that is not echoed back to the browser/i)).toBeInTheDocument();
    const editor = screen.getByRole("textbox", { name: "Temporary résumé revision" });
    expect(editor).toHaveValue("");
    await user.type(editor, "Python SQL");
    await user.click(screen.getByRole("button", { name: "Run Revision" }));
    expect(onRunRevision).toHaveBeenCalledWith("Python SQL", "Upload");
    expect(await screen.findByText(/Revision run was not retained/)).toBeInTheDocument();
  });

  it("has no automated accessibility violations in the comparison surface", async () => {
    const { container } = render(<ResumeLab {...revisionProps} runs={[makeRun("Baseline", "missing"), makeRun("Current", "matched")]} activeRunId="Current" notice={null} demoAvailable onSelectRun={vi.fn()} onClear={vi.fn()} onLoadDemoVariant={vi.fn()} />);
    const results = await axe(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it("marks only the authoritative comparison view for print export", async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<ResumeLab {...revisionProps} runs={[makeRun("Baseline", "missing"), makeRun("Current", "matched")]} activeRunId="Current" notice={null} demoAvailable={false} onSelectRun={vi.fn()} onClear={vi.fn()} onLoadDemoVariant={vi.fn()} />);
    await user.click(screen.getByText("Living Report comparison record"));
    await user.click(screen.getByRole("button", { name: "Print comparison report" }));
    expect(print).toHaveBeenCalledOnce();
    expect(document.documentElement).toHaveAttribute("data-print-view", "comparison");
    window.dispatchEvent(new Event("afterprint"));
    expect(document.documentElement).not.toHaveAttribute("data-print-view");
    print.mockRestore();
  });
});
