import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { EvidenceIntelligence } from "@/components/results/evidence-intelligence";
import { analysisV2ResponseSchema, analysisViewModel } from "@/lib/contracts";
import { v2Payload } from "./fixtures/evidence";

function ResultPolishHarness() {
  const result = analysisViewModel(analysisV2ResponseSchema.parse(v2Payload));
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <section className="results">
      <section id="summary"><h2>Summary</h2></section>
      <section id="findings">
        <ul className="term-cloud" aria-label="Primary returned concepts">
          <li title="Quality/regulatory"><button type="button" onClick={() => setSelected("finding_quality")}><span className="term-name">quality control</span></button></li>
          <li title="Tools/software"><button type="button" onClick={() => setSelected("finding_sql")}><span className="term-name">SQL</span></button></li>
        </ul>
      </section>
      <section id="review">Review</section>
      <section id="living-report">Report</section>
      <EvidenceIntelligence result={result} selectedFindingId={selected} reviewDecisions={{}} onSelectFinding={setSelected} />
    </section>
  );
}

describe("V2.1 result experience polish", () => {
  it("adds result search, category filtering, mobile anchors, and session-only technical disclosure", async () => {
    const user = userEvent.setup();
    render(<ResultPolishHarness />);

    const toolbar = await screen.findByLabelText("Result search and filters");
    expect(within(toolbar).getByText(/Showing 2 of 2 primary returned terms/)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Result sections" })).toBeInTheDocument();

    const search = within(toolbar).getByPlaceholderText("Search returned terms");
    await user.type(search, "quality");
    expect(screen.getByText("quality control").closest("li")).toBeVisible();
    expect(screen.getByText("SQL").closest("li")).not.toBeVisible();

    await user.clear(search);
    await user.click(within(toolbar).getByRole("button", { name: "Tools/software" }));
    expect(screen.getByText("SQL").closest("li")).toBeVisible();
    expect(screen.getByText("quality control").closest("li")).not.toBeVisible();

    const technicalToggle = screen.getByRole("button", { name: /Technical details/ });
    expect(technicalToggle).toHaveAttribute("aria-expanded", "true");
    await user.click(technicalToggle);
    expect(technicalToggle).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector(".results")).toHaveAttribute("data-technical-open", "false");

    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it("opens a literal evidence drawer from a primary concept without changing the result", async () => {
    const user = userEvent.setup();
    render(<ResultPolishHarness />);

    await user.click(screen.getByRole("button", { name: "quality control" }));
    const drawer = await screen.findByRole("dialog", { name: "Why this matched: quality control" });
    expect(drawer).toHaveTextContent("WHY THIS MATCHED");
    expect(drawer).toHaveTextContent("QC");
    expect(drawer).toHaveTextContent("resume_1");
    expect(drawer).toHaveTextContent("No fuzzy, embedding, or generative inference is used.");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Why this matched: quality control" })).not.toBeInTheDocument());
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });
});
