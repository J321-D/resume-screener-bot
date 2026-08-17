import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnalysisFingerprint } from "@/components/results/analysis-fingerprint";

const categories = [
  { category: "Technical skills", matched: 2, total: 4, score: 50, display_value: "50.0%", included_in_primary: true },
  { category: "Tools/software", matched: 1, total: 1, score: 100, display_value: "100.0%", included_in_primary: true },
  { category: "Uncategorized", matched: 0, total: 0, score: null, display_value: "N/A — no applicable concepts", included_in_primary: false },
];
const coverage = { score: 60, matched: 3, missing: 2, total: 5, label: "Keyword coverage" };

describe("AnalysisFingerprint", () => {
  it("renders a repeatable identifier and only authoritative category counts", () => {
    const { rerender } = render(<AnalysisFingerprint categories={categories} coverage={coverage} />);
    const first = screen.getByText(/^[0-9A-F]{8}$/).textContent;
    expect(screen.getByText("2 represented / 4 requested")).toBeInTheDocument();
    expect(screen.getByText("1 represented / 1 requested")).toBeInTheDocument();
    expect(screen.queryByText(/personality|employability|hiring probability/i)).toBeInTheDocument();

    rerender(<AnalysisFingerprint categories={categories} coverage={coverage} />);
    expect(screen.getByText(/^[0-9A-F]{8}$/)).toHaveTextContent(first ?? "");
  });

  it("changes its identifier when authoritative result counts change", () => {
    const { rerender } = render(<AnalysisFingerprint categories={categories} coverage={coverage} />);
    const first = screen.getByText(/^[0-9A-F]{8}$/).textContent;
    rerender(<AnalysisFingerprint categories={categories} coverage={{ ...coverage, matched: 4, missing: 1 }} />);
    expect(screen.getByText(/^[0-9A-F]{8}$/).textContent).not.toBe(first);
  });
});
