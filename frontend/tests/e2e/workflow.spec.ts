import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

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

const reviewPayload = {
  ...payload,
  coverage: { ...payload.coverage, missing: 4, total: 6 },
  missing_terms: [
    { term: "SQL", count: 4, category: "Tools/software" },
    { term: "GMP", count: 3, category: "Quality/regulatory" },
    { term: "cell-culture", count: 2, category: "Technical skills" },
    { term: "Node.js", count: 1, category: "Tools/software" },
  ],
};

test("completes a keyboard-accessible pasted-text analysis", async ({ page }) => {
  await page.route("**/api/v1/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Résumé text").fill("QC Python");
  await page.getByLabel("Job-description text").fill("quality control Python SQL");
  await expect(page.getByText("9 / 200,000 characters", { exact: true })).toBeVisible();
  await expect(page.getByText("26 / 200,000 characters", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();
  await expect(page.getByRole("heading", { name: "Your lexical coverage map" })).toBeVisible();
  await expect(page.getByRole("img", { name: "66.7% keyword coverage" })).toBeVisible();
  await expect(page.getByLabel("Coverage opportunities").getByText("SQL", { exact: true })).toBeVisible();
});

test("has no horizontal overflow at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("reflows without horizontal overflow at 200 percent zoom", async ({ page }) => {
  // A 640 CSS-pixel viewport represents a 1280-pixel display at 200% browser zoom.
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Map your résumé to the role." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("loads the synthetic demo through the real workflow and clears URL state", async ({ page }) => {
  await page.route("**/api/v1/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(reviewPayload) }));
  await page.goto("/?demo=1#workspace");
  await expect(page.getByText("Synthetic demo loaded.")).toBeVisible();
  await expect(page).not.toHaveURL(/demo=1/);
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();
  await expect(page.getByRole("heading", { name: "Your lexical coverage map" })).toBeVisible();
  await page.getByRole("button", { name: "New analysis" }).click();
  await page.getByRole("button", { name: "Clear and start new" }).click();
  await expect(page.getByLabel("Résumé text")).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Your lexical coverage map" })).toHaveCount(0);
});

test("keeps responsive navigation keyboard accessible at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open navigation menu" });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Help" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("honors reduced-motion preferences without hiding results", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v1/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Résumé text").fill("QC Python");
  await page.getByLabel("Job-description text").fill("quality control Python SQL");
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();

  const heading = page.getByRole("heading", { name: "Your lexical coverage map" });
  await expect(heading).toBeVisible();
  await expect(page.locator("section.results")).toBeFocused();
  await expect(page.getByRole("img", { name: "66.7% keyword coverage" })).toBeVisible();

  const transitionSeconds = await page.locator(".ring-value").evaluate((element) => {
    const duration = getComputedStyle(element).transitionDuration;
    const value = Number.parseFloat(duration);
    return duration.endsWith("ms") ? value / 1_000 : value;
  });
  expect(transitionSeconds).toBeLessThanOrEqual(0.001);
});

test("keeps analysis inputs isolated across browser tabs", async ({ page, context }) => {
  const secondPage = await context.newPage();
  await Promise.all([page.goto("/"), secondPage.goto("/")]);

  await page.getByLabel("Résumé text").fill("First tab Python");
  await page.getByLabel("Job-description text").fill("First role SQL");
  await secondPage.getByLabel("Résumé text").fill("Second tab MATLAB");
  await secondPage.getByLabel("Job-description text").fill("Second role GMP");

  await expect(page.getByLabel("Résumé text")).toHaveValue("First tab Python");
  await expect(page.getByLabel("Job-description text")).toHaveValue("First role SQL");
  await expect(secondPage.getByLabel("Résumé text")).toHaveValue("Second tab MATLAB");
  await expect(secondPage.getByLabel("Job-description text")).toHaveValue("Second role GMP");
});

test("reviews ordered opportunities and clears decisions when inputs become stale", async ({ page }) => {
  await page.route("**/api/v1/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(reviewPayload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Résumé text").fill("QC Python");
  await page.getByLabel("Job-description text").fill("quality control Python SQL GMP cell-culture Node.js");
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();

  await expect(page.getByRole("heading", { name: "Turn opportunities into an editing plan" })).toBeVisible();
  const reviewList = page.getByLabel("Opportunity review list");
  await expect(reviewList.getByRole("article")).toHaveCount(4);
  await expect(reviewList.getByRole("article").nth(0)).toContainText("SQL");
  await expect(reviewList.getByRole("article").nth(3)).toContainText("Node.js");

  await page.getByLabel("Review status for SQL").selectOption("add");
  await page.getByLabel("Review status for GMP").selectOption("later");
  await expect(page.getByText("2 of 4")).toBeVisible();
  const checklistButton = page.getByRole("button", { name: "Download Markdown checklist" });
  await expect(checklistButton).toBeEnabled();
  const downloadPromise = page.waitForEvent("download");
  await checklistButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("resume-action-checklist.md");
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const checklist = await readFile(downloadPath!, "utf8");
  expect(checklist).toContain("# Résumé action checklist");
  expect(checklist).toContain("- [ ] SQL");
  expect(checklist).not.toContain("- [ ] GMP");

  await page.getByRole("radio", { name: "Review later" }).check();
  await expect(reviewList.getByRole("article")).toHaveCount(1);
  await expect(reviewList).toContainText("GMP");

  await page.getByLabel("Résumé text").fill("QC Python MATLAB");
  await expect(page.getByText(/review decisions were cleared/i)).toBeVisible();
  await expect(page.getByLabel("Review status for SQL")).toHaveValue("");
  await expect(page.getByLabel("Review status for SQL")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Download Markdown checklist" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
