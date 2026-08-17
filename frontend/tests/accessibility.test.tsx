import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";

import { Analyzer } from "@/components/analysis/analyzer";
import { HelpCenter } from "@/components/help/help-center";
import { Hero } from "@/components/shell/hero";

describe("accessibility foundation", () => {
  it("has no automated violations in the hero and input workspace", async () => {
    const { container } = render(<><Hero /><Analyzer /></>);
    // jsdom does not implement canvas, which axe needs for its color-contrast rule.
    // Contrast is verified separately in the real-browser smoke pass.
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("has no automated violations in the searchable help library", async () => {
    const { container } = render(<HelpCenter />);
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("has no automated violations in a completed analysis and review workspace", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      analysis_mode: "Skills-focused analysis",
      coverage: { score: 50, matched: 1, missing: 1, total: 2, label: "Categorized Keyword Coverage" },
      matched_terms: [{ term: "Python", count: 1, category: "Tools/software" }],
      missing_terms: [{ term: "SQL", count: 1, category: "Tools/software" }],
      categories: [{ category: "Tools/software", matched: 1, total: 2, score: 50, display_value: "50.0%", included_in_primary: true }],
      normalized_matches: [],
      metadata: { resume_label: "Pasted résumé", resume_count: 1, input_mode: "pasted_text", analyzed_at: "2026-08-11T16:00:00Z" },
      warnings: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const { container } = render(<Analyzer />);

    await user.type(screen.getByLabelText("Résumé text"), "Python");
    await user.type(screen.getByLabelText("Job-description text"), "Python SQL");
    await user.click(screen.getByRole("button", { name: "Run Keyword Scan" }));
    await screen.findByRole("heading", { name: "Your lexical coverage map" }, { timeout: 3_000 });

    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
