import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnalysisPlayback } from "@/components/results/analysis-playback";
import { LivingReport } from "@/components/results/living-report";
import { SystemTransparency } from "@/components/results/system-transparency";
import { ExperienceControls } from "@/components/shell/experience-controls";

const result = {
  analysis_mode: "Skills-focused analysis" as const,
  coverage: { score: 66.7, matched: 2, missing: 1, total: 3, label: "Categorized Keyword Coverage" },
  matched_terms: [{ term: "Python", count: 1, category: "Tools/software" }],
  missing_terms: [{ term: "SQL", count: 2, category: "Tools/software" }],
  categories: [{ category: "Tools/software", matched: 1, total: 2, score: 50, display_value: "50.0%", included_in_primary: true }],
  normalized_matches: [],
  metadata: { resume_label: "Pasted résumé", resume_count: 1, input_mode: "pasted_text", analyzed_at: "2026-08-06T16:00:00Z" },
  warnings: [],
};

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("result experience layer", () => {
  it("walks the existing result map without persistence or score changes", async () => {
    const user = userEvent.setup();
    render(<><div id="summary" tabIndex={-1} /><div id="fingerprint" tabIndex={-1} /><AnalysisPlayback result={result} reducedMotion /></>);
    await user.click(screen.getByRole("button", { name: "Start walkthrough" }));
    expect(screen.getByRole("status")).toHaveTextContent("Coverage");
    await user.click(screen.getByRole("button", { name: "Next walkthrough stage" }));
    expect(screen.getByRole("status")).toHaveTextContent("Signature");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "center" });
    expect(screen.getByText(/2 represented · 1 opportunities/)).toBeInTheDocument();
    expect(localStorage).toHaveLength(0);
  });

  it("renders a stale-aware screen report in API order", () => {
    render(<LivingReport result={result} stale />);
    expect(screen.getByText("Living Report")).toBeInTheDocument();
    expect(screen.getByText(/Inputs changed after this result/)).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText(/protected server report engine/)).toBeInTheDocument();
  });

  it("bounds screen-report term rendering while preserving the returned prefix", () => {
    const missingTerms = Array.from({ length: 55 }, (_, index) => ({ term: `term-${index + 1}`, count: 1, category: "Tools/software" }));
    render(<LivingReport result={{ ...result, missing_terms: missingTerms }} stale={false} />);
    expect(screen.getByText("term-50")).toBeInTheDocument();
    expect(screen.queryByText("term-51")).not.toBeInTheDocument();
    expect(screen.getByText("First 50 of 55, preserving engine order.")).toBeInTheDocument();
  });

  it("shows only factual local performance and contract-boundary information", async () => {
    const user = userEvent.setup();
    Object.defineProperty(performance, "getEntriesByType", { configurable: true, value: vi.fn(() => [{ domContentLoadedEventEnd: 120, loadEventEnd: 180 }]) });
    render(<SystemTransparency result={result} />);
    expect(screen.getByText(/Exact source spans.*compatibility response/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show performance HUD" }));
    expect(screen.getByText("120 ms")).toBeInTheDocument();
    expect(screen.getByText("180 ms")).toBeInTheDocument();
    expect(screen.getByText(/NOT TRANSMITTED/)).toBeInTheDocument();
  });

  it("switches the session-only precision-lab theme without storage", async () => {
    const user = userEvent.setup();
    render(<ExperienceControls />);
    await user.click(screen.getByRole("button", { name: "Precision light" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "precision-light");
    expect(screen.getByRole("button", { name: "Command dark" })).toHaveAttribute("aria-pressed", "true");
    expect(localStorage).toHaveLength(0);
  });
});
