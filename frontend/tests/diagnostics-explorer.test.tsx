import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { DiagnosticsExplorer } from "@/components/results/diagnostics-explorer";
import { analysisV2ResponseSchema, analysisViewModel } from "@/lib/contracts";
import { v2Payload } from "./fixtures/evidence";

describe("DiagnosticsExplorer", () => {
  it("reports only returned deterministic rules and traces authoritative evidence", async () => {
    const user = userEvent.setup();
    const payload = {
      ...v2Payload,
      diagnostics: [
        { diagnostic_id: "diagnostic_text", rule_id: "document.text_extracted", rule_group: "document", status: "pass", reason_code: "canonical_text_available", source_document_id: "resume_1", evidence_refs: [], message: "Readable canonical text was extracted from resume_1." },
        { diagnostic_id: "diagnostic_gap", rule_id: "coverage.opportunities_present", rule_group: "coverage", status: "review", reason_code: "coverage_opportunities_present", source_document_id: null, evidence_refs: ["evidence_sql"], message: "1 lexical coverage opportunity term requires human review." },
      ],
    };
    const result = analysisViewModel(analysisV2ResponseSchema.parse(payload));
    const onSelectFinding = vi.fn();
    const { container } = render(<DiagnosticsExplorer result={result} onSelectFinding={onSelectFinding} />);

    expect(screen.getByText("2 rules evaluated")).toBeInTheDocument();
    expect(screen.queryByText(/267|development check/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Trace evidence" }));
    expect(onSelectFinding).toHaveBeenCalledWith("finding_sql");
    const report = await axe(container, { rules: { "color-contrast": { enabled: false } } });
    expect(report.violations).toEqual([]);
  });
});
