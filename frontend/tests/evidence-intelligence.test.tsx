import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EvidenceIntelligence } from "@/components/results/evidence-intelligence";
import { analysisV2ResponseSchema, analysisViewModel } from "@/lib/contracts";
import { analysis, v2Payload } from "./fixtures/evidence";

describe("Contract v2 evidence view model", () => {
  it("carries v1 analysis fields forward unchanged and keeps evidence additive", () => {
    const parsed = analysisV2ResponseSchema.parse(v2Payload);
    const view = analysisViewModel(parsed);
    expect({ ...view, evidenceContract: undefined }).toEqual({ ...analysis, evidenceContract: undefined });
    expect(view.evidenceContract.version).toBe("2.0");
    expect(view.evidenceContract.findings.map((item) => item.finding_id)).toEqual(["finding_quality", "finding_sql"]);
  });

  it("marks legacy responses explicitly unavailable without changing their result", () => {
    const view = analysisViewModel(analysis);
    expect(view.coverage).toEqual(analysis.coverage);
    expect(view.evidenceContract).toEqual({ version: "unavailable", findings: [], sourceDocuments: [], diagnostics: [] });
  });

  it("keeps rolling compatibility with pre-block v2 responses", () => {
    const payload = structuredClone(v2Payload);
    for (const document of payload.source_documents) delete (document as Partial<typeof document>).blocks;
    const parsed = analysisV2ResponseSchema.parse(payload);
    expect(parsed.source_documents.every((document) => document.blocks.length === 0)).toBe(true);
  });

  it("rejects a noncontiguous canonical document view", () => {
    const payload = structuredClone(v2Payload);
    payload.source_documents[0].blocks[0].start = 1;
    expect(() => analysisV2ResponseSchema.parse(payload)).toThrow(/contiguous/);
  });
});

describe("EvidenceIntelligence", () => {
  it("shows exact returned surfaces, offsets, methods, and explicit unknown structure only", async () => {
    const user = userEvent.setup();
    const result = analysisViewModel(analysisV2ResponseSchema.parse(v2Payload));
    const onSelectFinding = vi.fn();
    const { rerender } = render(<EvidenceIntelligence result={result} selectedFindingId="finding_quality" reviewDecisions={{}} onSelectFinding={onSelectFinding} />);
    const inspector = screen.getByRole("article", { name: "quality control" });
    expect(inspector).toHaveTextContent("curated synonym");
    expect(inspector).toHaveTextContent("QC");
    expect(inspector).toHaveTextContent("[0, 2)");
    expect(inspector).toHaveTextContent("Unavailable — parser limitation");
    expect(inspector).not.toHaveTextContent("QC engineer SQL");

    await user.click(within(inspector).getByText("Machine View"));
    expect(inspector).toHaveTextContent("Deterministic evidence representation—not an AI reasoning trace.");
    rerender(<EvidenceIntelligence result={result} selectedFindingId="finding_sql" reviewDecisions={{ finding_sql: "later" }} onSelectFinding={onSelectFinding} />);
    await waitFor(() => expect(screen.getByRole("article", { name: "SQL" })).toHaveTextContent("job_description_1 · [16, 19)"));
  });

  it("cross-filters by status, source, method, and stable review decision", async () => {
    const user = userEvent.setup();
    const result = analysisViewModel(analysisV2ResponseSchema.parse(v2Payload));
    render(<EvidenceIntelligence result={result} selectedFindingId={null} reviewDecisions={{ finding_sql: "later" }} onSelectFinding={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText("Status"), "missing");
    expect(screen.getByRole("button", { name: /SQL/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /quality control/i })).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Review"), "later");
    await user.selectOptions(screen.getByLabelText("Source"), "job_description");
    await user.selectOptions(screen.getByLabelText("Method"), "not_detected");
    expect(screen.getByRole("button", { name: /SQL/i })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Method"), "curated_synonym");
    expect(screen.getByText("No authoritative findings match these filters.")).toBeInTheDocument();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });
});
