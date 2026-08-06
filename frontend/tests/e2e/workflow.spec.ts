import { expect, test } from "@playwright/test";

const payload = {
  analysis_mode: "Skills-focused analysis",
  coverage: { score: 66.7, matched: 2, missing: 1, total: 3, label: "Categorized Keyword Coverage" },
  matched_terms: [{ term: "quality control", count: 1, category: "Quality/regulatory" }, { term: "Python", count: 1, category: "Tools/software" }],
  missing_terms: [{ term: "SQL", count: 1, category: "Tools/software" }],
  categories: [{ category: "Tools/software", matched: 1, total: 2, score: 50, display_value: "50.0%", included_in_primary: true }],
  normalized_matches: [{ concept: "quality control", resume_term: "QC", job_term: "quality control" }],
  metadata: { resume_label: "Pasted résumé", resume_count: 1, input_mode: "pasted_text", analyzed_at: "2026-08-06T16:00:00Z" },
  warnings: [],
};

test("completes a keyboard-accessible pasted-text analysis", async ({ page }) => {
  await page.route("**/api/v1/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }));
  await page.goto("/");
  await page.getByLabel("Résumé text").fill("QC Python");
  await page.getByLabel("Job-description text").fill("quality control Python SQL");
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();
  await expect(page.getByRole("heading", { name: "Your lexical coverage map" })).toBeVisible();
  await expect(page.getByRole("img", { name: "66.7% keyword coverage" })).toBeVisible();
  await expect(page.getByText("SQL", { exact: true })).toBeVisible();
});

test("has no horizontal overflow at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});
