import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { DocumentXRay, segmentDocumentBlock } from "@/components/results/document-xray";
import { analysisV2ResponseSchema, analysisViewModel } from "@/lib/contracts";
import { v2Payload } from "./fixtures/evidence";

describe("DocumentXRay", () => {
  it("reconstructs exact text, highlights represented evidence only, and switches sources", async () => {
    const user = userEvent.setup();
    const result = analysisViewModel(analysisV2ResponseSchema.parse(v2Payload));
    const onSelectFinding = vi.fn();
    render(<DocumentXRay result={result} selectedFindingId={null} reviewDecisions={{}} onSelectFinding={onSelectFinding} />);

    const resume = screen.getByRole("article", { name: "Résumé canonical text" });
    expect(resume).toHaveTextContent("QC Python x");
    expect(within(resume).getByRole("button", { name: "QC" })).toBeInTheDocument();
    expect(screen.getByText(/not-detected findings are listed separately/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "SQL", pressed: false })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Job description" }));
    expect(screen.getByRole("article", { name: "Job description canonical text" })).toHaveTextContent("quality control SQL");
    expect(within(screen.getByRole("article", { name: "Job description canonical text" })).queryByRole("button", { name: "SQL" })).not.toBeInTheDocument();
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it("supports scanner controls, exact Unicode segmentation, keyboard selection, and navigation", async () => {
    const user = userEvent.setup();
    const result = analysisViewModel(analysisV2ResponseSchema.parse(v2Payload));
    const onSelectFinding = vi.fn();
    render(<DocumentXRay result={result} selectedFindingId="finding_quality" reviewDecisions={{ finding_quality: "represented" }} onSelectFinding={onSelectFinding} />);
    const mark = screen.getByRole("button", { name: "QC" });
    mark.focus();
    await user.keyboard("{Enter}");
    expect(onSelectFinding).toHaveBeenCalledWith("finding_quality");
    await user.click(screen.getByRole("button", { name: "Scanner on" }));
    expect(screen.getByRole("button", { name: "Scanner off" })).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Next evidence" }));
    expect(onSelectFinding).toHaveBeenLastCalledWith("finding_quality");

    const segments = segmentDocumentBlock(
      { block_id: "unicode", start: 0, end: 4, text: "A😀品質", block_type: { value: null, unknown_reason: "parser_limitation" }, evidence_refs: ["unicode-evidence"] },
      [{ finding: result.evidenceContract.findings[0], evidence: { ...result.evidenceContract.findings[0].evidence[0], source_span: { start: 1, end: 3, unit: "unicode_code_point" }, matched_surface: "😀品" } }],
    );
    expect(segments.map((item) => item.text).join("")).toBe("A😀品質");
    expect(segments.find((item) => item.occurrence)?.text).toBe("😀品");
  });

  it("renders authoritative semantic sections while preserving canonical view", async () => {
    const user = userEvent.setup();
    const payload = structuredClone(v2Payload) as Record<string, unknown>;
    const documents = payload.source_documents as Array<Record<string, unknown>>;
    documents[0].document_structure_metadata = { availability: "detected", section_count: 1, detection_methods: ["standalone_known_heading"] };
    documents[0].sections = [{ section_id: "section_skills", raw_heading: "QC", normalized_type: "skills", detection_method: "standalone_known_heading", start: 0, end: 11, heading_span: { start: 0, end: 2, unit: "unicode_code_point" } }];
    const result = analysisViewModel(analysisV2ResponseSchema.parse(payload));

    render(<DocumentXRay result={result} selectedFindingId={null} reviewDecisions={{}} onSelectFinding={vi.fn()} />);

    expect(screen.getByText("1 detected sections")).toBeInTheDocument();
    expect(screen.getByText("skills")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Canonical text/i }));
    expect(screen.getByRole("article", { name: "Résumé canonical text" })).toHaveTextContent("QC Python x");
  });

  it("navigates repeated occurrences of the same finding independently", async () => {
    const user = userEvent.setup();
    const payload = structuredClone(analysisV2ResponseSchema.parse(v2Payload));
    payload.source_documents[0].blocks[0].text = "QC QC xxxxx";
    payload.source_documents[0].blocks[0].evidence_refs.push("evidence_qc_2");
    payload.findings[0].evidence.push({
      ...payload.findings[0].evidence[0],
      evidence_id: "evidence_qc_2",
      source_span: { start: 3, end: 5, unit: "unicode_code_point" },
    });
    const result = analysisViewModel(analysisV2ResponseSchema.parse(payload));
    render(<DocumentXRay result={result} selectedFindingId="finding_quality" reviewDecisions={{}} onSelectFinding={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("1 / 2")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "Next evidence" }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("has no critical automated accessibility violations", async () => {
    const result = analysisViewModel(analysisV2ResponseSchema.parse(v2Payload));
    const { container } = render(<DocumentXRay result={result} selectedFindingId="finding_quality" reviewDecisions={{}} onSelectFinding={vi.fn()} />);
    const report = await axe(container, { rules: { "color-contrast": { enabled: false } } });
    expect(report.violations).toEqual([]);
  });
});
