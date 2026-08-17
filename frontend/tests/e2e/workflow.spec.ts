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

const evidencePayload = {
  contract_version: "2.0",
  analysis: payload,
  source_documents: [
    { document_id: "resume_1", source_document: "resume", media_type: "text/plain", canonical_text_characters: 9, offset_basis: "server_canonical_extracted_text", document_structure_metadata: { value: null, unknown_reason: "parser_limitation" }, formatting_metadata: { value: null, unknown_reason: "parser_limitation" }, blocks: [{ block_id: "block-resume", start: 0, end: 9, text: "QC Python", block_type: { value: null, unknown_reason: "parser_limitation" }, evidence_refs: ["evidence-qc"] }] },
    { document_id: "job_description_1", source_document: "job_description", media_type: "text/plain", canonical_text_characters: 26, offset_basis: "server_canonical_extracted_text", document_structure_metadata: { value: null, unknown_reason: "parser_limitation" }, formatting_metadata: { value: null, unknown_reason: "parser_limitation" }, blocks: [{ block_id: "block-job", start: 0, end: 26, text: "quality control Python SQL", block_type: { value: null, unknown_reason: "parser_limitation" }, evidence_refs: ["evidence-sql"] }] },
  ],
  findings: [
    { finding_id: "finding-quality", comparison_key: "skills_focused.concept_coverage:quality control", rule_id: "skills_focused.concept_coverage", category: "Quality/regulatory", status: "matched", reason: "curated_normalization", display_term: "quality control", normalized_term: "quality control", match_method: "curated_synonym", evidence: [{ evidence_id: "evidence-qc", source_document: "resume", document_id: "resume_1", source_section: { value: null, unknown_reason: "parser_limitation" }, source_span: { start: 0, end: 2, unit: "unicode_code_point" }, matched_surface: "QC", normalized_term: "quality control" }], unavailable_evidence_reason: null },
    { finding_id: "finding-sql", comparison_key: "skills_focused.concept_coverage:sql", rule_id: "skills_focused.concept_coverage", category: "Tools/software", status: "missing", reason: "not_detected", display_term: "SQL", normalized_term: "sql", match_method: "not_detected", evidence: [{ evidence_id: "evidence-sql", source_document: "job_description", document_id: "job_description_1", source_section: { value: null, unknown_reason: "parser_limitation" }, source_span: { start: 23, end: 26, unit: "unicode_code_point" }, matched_surface: "SQL", normalized_term: "sql" }], unavailable_evidence_reason: null },
  ],
};

test("completes a keyboard-accessible pasted-text analysis", async ({ page }) => {
  await page.route("**/api/v2/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }));
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

test("inspects canonical documents and synchronizes X-Ray with authoritative TRACE", async ({ page }) => {
  await page.route("**/api/v2/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(evidencePayload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Résumé text").fill("QC Python");
  await page.getByLabel("Job-description text").fill("quality control Python SQL");
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();
  const resumeDocument = page.getByRole("article", { name: "Résumé canonical text" });
  await expect(resumeDocument).toContainText("QC Python");
  await resumeDocument.getByRole("button", { name: "QC" }).press("Enter");
  await expect(page.getByText("SCANNER LENS").locator("..")).toContainText("quality control");
  await page.getByRole("tab", { name: "Job description" }).click();
  const jobDocument = page.getByRole("article", { name: "Job description canonical text" });
  await expect(jobDocument).toContainText("quality control Python SQL");
  await expect(jobDocument.getByRole("button", { name: "SQL" })).toHaveCount(0);
  await page.getByRole("button", { name: "Scanner on" }).click();
  await expect(page.getByRole("button", { name: "Scanner off" })).toHaveAttribute("aria-pressed", "false");
  await page.getByLabel("Authoritative findings").getByRole("button", { name: /quality control/i }).click();
  const inspector = page.getByRole("article", { name: "quality control" });
  await expect(inspector).toContainText("curated synonym");
  await expect(inspector).toContainText("resume_1 · [0, 2)");
  await expect(inspector).toContainText("QC");
  await inspector.getByText("Machine View").click();
  await expect(inspector).toContainText("not an AI reasoning trace");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("compares two session-only résumé runs and clears them on refresh", async ({ page }) => {
  let requestCount = 0;
  const revised = structuredClone(evidencePayload);
  revised.analysis = {
    ...revised.analysis,
    coverage: { ...revised.analysis.coverage, score: 100, matched: 3, missing: 0 },
    matched_terms: [...revised.analysis.matched_terms, { term: "SQL", count: 1, category: "Tools/software" }],
    missing_terms: [],
  };
  revised.findings = revised.findings.map((finding) => finding.comparison_key.endsWith(":sql") ? {
    ...finding,
    finding_id: "finding-sql-current",
    status: "matched",
    reason: "exact_match",
    match_method: "exact",
    evidence: [],
    unavailable_evidence_reason: null,
  } : finding);
  await page.route("**/api/v2/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(requestCount++ ? revised : evidencePayload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Résumé text").fill("QC Python");
  await page.getByLabel("Job-description text").fill("quality control Python SQL");
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();
  await expect(page.getByRole("heading", { name: "Resume Lab" })).toBeVisible();
  await page.getByLabel("Temporary résumé revision").fill("QC Python SQL");
  await expect(page.getByLabel("Résumé text")).toHaveValue("QC Python");
  await page.getByRole("button", { name: "Run Revision" }).click();
  await expect(page.getByText("2 / 5 runs")).toBeVisible();
  await expect(page.getByText("Revision run completed. Diff Reactor now compares it with the selected baseline.")).toBeVisible();
  await expect(page.getByLabel("Résumé text")).toHaveValue("QC Python SQL");
  await expect(page.getByText(/temporary text revision/).first()).toBeVisible();
  await expect(page.locator(".comparison-grid")).toContainText("Newly represented");
  await page.locator(".comparison-grid").getByRole("button", { name: /SQL/i }).click();
  await expect(page.getByRole("article", { name: "SQL" })).toBeVisible();
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Resume Lab" })).toHaveCount(0);
});

test("uses the command palette and evidence focus without changing the result", async ({ page }, testInfo) => {
  await page.route("**/api/v2/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  async function openCommands() {
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
      await page.getByRole("button", { name: /Commands/ }).click();
    } else {
      await page.keyboard.press("Control+k");
    }
  }

  await openCommands();
  await expect(page.getByRole("dialog", { name: "Go directly to the next task." })).toBeVisible();
  await expect(page.getByText("Review missing terms")).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.getByLabel("Résumé text").fill("QC Python");
  await page.getByLabel("Job-description text").fill("quality control Python SQL");
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();
  await expect(page.getByRole("heading", { name: "Your lexical coverage map" })).toBeVisible();
  const resultsCommandDialog = page.getByRole("dialog", { name: "Go directly to the next task." });
  if (!(await resultsCommandDialog.isVisible())) {
    if (testInfo.project.name === "mobile") {
      await page.getByRole("button", { name: "Open navigation menu" }).click();
    }
    await page.getByRole("button", { name: /Commands/ }).click();
  }
  await expect(resultsCommandDialog).toBeVisible();
  await resultsCommandDialog.getByText("Review missing terms").click();
  await expect(page.locator(".review-workspace")).toBeFocused();

  await page.locator(".category-bars").getByRole("button", { name: /Tools\/software.*50\.0%/i }).click();
  await expect(page.getByRole("complementary", { name: "Focused evidence view" })).toContainText("Category evidence isolated");
  await expect(page.getByRole("img", { name: "66.7% keyword coverage" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("has no horizontal overflow at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test("boots the analysis core and settles the hero without hiding content", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const hero = page.locator("[data-hero-sequence='system-boot']");
  await expect(hero).toBeVisible();
  await expect(page.locator(".spatial-environment")).toBeAttached();
  await expect(page.getByRole("img", { name: "Analysis core showing five deterministic lexical dimensions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Map your résumé to the role." })).toHaveCSS("opacity", "1");
  await expect(page.locator(".analysis-core")).toHaveCSS("opacity", "1");
  expect(await page.locator(".analysis-core").evaluate((element) => getComputedStyle(element).animationName)).toContain("core-drift");
});

test("reflows without horizontal overflow at 200 percent zoom", async ({ page }) => {
  // A 640 CSS-pixel viewport represents a 1280-pixel display at 200% browser zoom.
  await page.setViewportSize({ width: 640, height: 800 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Map your résumé to the role." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("keeps core controls visible in forced-colors mode", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Map your résumé to the role." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run Keyword Scan" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("loads the synthetic demo through the real workflow and clears URL state", async ({ page }) => {
  await page.route("**/api/v2/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(reviewPayload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "Try synthetic demo" }).click();
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

test("keeps searchable help task-oriented and usable at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/help");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Clear answers for a transparent lexical tool." })).toBeVisible();
  await page.getByRole("searchbox", { name: "Search help" }).fill("66.7");
  await expect(page.getByRole("heading", { name: "What does 66.7% coverage mean?" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Which documents can I use?" })).toHaveCount(0);
  await expect(page.getByText(/does not mean a 66.7% chance/i)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("honors reduced-motion preferences without hiding results", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/v2/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "Map your résumé to the role." })).toHaveCSS("opacity", "1");
  await expect(page.locator(".analysis-core")).toHaveCSS("animation-name", "none");
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
  await page.route("**/api/v2/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(reviewPayload) }));
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

test("uses Gap Mode as a session-only ordered review mission", async ({ page }) => {
  await page.route("**/api/v2/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(reviewPayload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Résumé text").fill("QC Python");
  await page.getByLabel("Job-description text").fill("quality control Python SQL GMP cell-culture Node.js");
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();

  await page.getByRole("button", { name: "Review unresolved gaps" }).click();
  await expect(page.getByRole("dialog", { name: "SQL" })).toContainText("01 / 04");
  await page.getByLabel("Session note for SQL").fill("Verify database experience.");
  await page.getByLabel("Gap decision for SQL").selectOption("add");
  await expect(page.getByRole("dialog", { name: "GMP" })).toContainText("01 / 03");
  await expect(page.getByText("1 / 4 resolved")).toBeVisible();
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("walks, presents, and reports the same result without persistence", async ({ page }) => {
  await page.route("**/api/v2/analyze", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(reviewPayload) }));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Résumé text").fill("QC Python");
  await page.getByLabel("Job-description text").fill("quality control Python SQL GMP");
  await page.getByRole("button", { name: "Run Keyword Scan" }).click();
  await expect(page.getByRole("heading", { name: "Your lexical coverage map" })).toBeVisible();

  await page.getByRole("button", { name: "Start walkthrough" }).click();
  await expect(page.getByRole("status").filter({ hasText: "STAGE 01" })).toContainText("Coverage");
  await page.getByRole("button", { name: "Next walkthrough stage" }).click();
  await expect(page.getByRole("status").filter({ hasText: "STAGE 02" })).toContainText("Signature");

  const themeButton = page.getByRole("button", { name: "Precision light" });
  if (!await themeButton.isVisible()) await page.getByRole("button", { name: "Open navigation menu" }).click();
  await themeButton.click();
  const closeMenu = page.getByRole("button", { name: "Close navigation menu" });
  if (await closeMenu.isVisible()) await closeMenu.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "precision-light");
  await page.getByText("Living Report", { exact: true }).click();
  await expect(page.getByText("LIVE ANALYSIS RECORD")).toBeVisible();
  await page.getByRole("button", { name: "Show performance HUD" }).click();
  await expect(page.getByText(/LOCAL BROWSER TELEMETRY.*NOT TRANSMITTED/)).toBeVisible();

  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});
