import { expect, test } from "@playwright/test";

const payload = {
  analysis_mode: "Skills-focused analysis",
  coverage: {
    score: 20.0,
    matched: 4,
    missing: 16,
    total: 20,
    label: "Categorized Keyword Coverage",
  },
  matched_terms: [
    { term: "process scale-up", count: 1, category: "Technical skills" },
    { term: "BS degree", count: 1, category: "Education" },
    { term: "Mammalian cell culture", count: 1, category: "Technical skills" },
    { term: "Bioprocesses", count: 1, category: "Technical skills" },
  ],
  missing_terms: [
    { term: "technology transfer", count: 1, category: "Technical skills" },
  ],
  categories: [
    { category: "Technical skills", matched: 3, total: 18, score: 16.7, display_value: "16.7%", included_in_primary: true },
    { category: "Education", matched: 1, total: 1, score: 100, display_value: "100.0%", included_in_primary: true },
    { category: "Experience/action terms", matched: 0, total: 1, score: 0, display_value: "0.0%", included_in_primary: true },
  ],
  normalized_matches: [],
  metadata: {
    resume_label: "Pasted résumé",
    resume_count: 1,
    input_mode: "pasted_text",
    analyzed_at: "2026-08-29T19:24:00Z",
  },
  warnings: [],
};

test("stacks summary metrics without clipping at 325px", async ({ page }) => {
  await page.setViewportSize({ width: 325, height: 836 });
  await page.route("**/api/v2/analyze", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }),
  );

  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-analysis-state", /^(idle|input_ready)$/);
  await page.getByLabel("Résumé text").fill("process scale-up BS degree mammalian cell culture Bioprocesses");
  await page.getByLabel("Job-description text").fill("technology transfer process scale-up BS degree");
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();
  await expect(page.getByRole("img", { name: "20.0% categorized keyword coverage" })).toBeVisible();

  const cards = page.locator(".metric-stack .metric-card");
  await expect(cards).toHaveCount(3);

  const boxes = await cards.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    }),
  );

  expect(Math.abs(boxes[0].left - boxes[1].left)).toBeLessThan(1);
  expect(Math.abs(boxes[1].left - boxes[2].left)).toBeLessThan(1);
  expect(boxes[1].top).toBeGreaterThan(boxes[0].bottom);
  expect(boxes[2].top).toBeGreaterThan(boxes[1].bottom);

  const valueBoxes = await cards.locator("strong").evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    }),
  );
  for (const box of valueBoxes) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(325);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
