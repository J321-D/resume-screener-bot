import { describe, expect, it } from "vitest";

import {
  appendAnalysisRun,
  compareAnalysisRuns,
  MAX_LAB_RUNS,
  MAX_RESUME_VARIANTS,
  type AnalysisRun,
} from "@/components/lab/comparison-model";
import type { AnalysisFinding, AnalysisViewModel } from "@/lib/contracts";
import { inputSignature, jobInputIdentity, resumeInputIdentity } from "@/lib/formatting";

function finding(key: string, status: "matched" | "missing", category = "Tools/software"): AnalysisFinding {
  return {
    finding_id: `finding-${key}`,
    comparison_key: `skills_focused.concept_coverage:${key}`,
    rule_id: "skills_focused.concept_coverage",
    category,
    status,
    reason: status === "matched" ? "exact_match" : "not_detected",
    display_term: key,
    normalized_term: key.toLocaleLowerCase(),
    match_method: status === "matched" ? "exact" : "not_detected",
    evidence: [],
    unavailable_evidence_reason: "not_detected",
  };
}

function run(id: string, findings: AnalysisFinding[], options: Partial<AnalysisRun> = {}): AnalysisRun {
  const matched = findings.filter((item) => item.status === "matched").length;
  const total = findings.length;
  const analysis: AnalysisViewModel = {
    analysis_mode: "Skills-focused analysis",
    coverage: { score: total ? Number(((matched / total) * 100).toFixed(1)) : null, matched, missing: total - matched, total, label: "Categorized Keyword Coverage" },
    matched_terms: findings.filter((item) => item.status === "matched").map((item) => ({ term: item.display_term, count: 1, category: item.category })),
    missing_terms: findings.filter((item) => item.status === "missing").map((item) => ({ term: item.display_term, count: 1, category: item.category })),
    categories: [{ category: "Tools/software", matched, total, score: total ? Number(((matched / total) * 100).toFixed(1)) : null, display_value: total ? `${((matched / total) * 100).toFixed(1)}%` : "N/A — no applicable concepts", included_in_primary: true }],
    normalized_matches: [],
    metadata: { resume_label: id, resume_count: 1, input_mode: "pasted_text", analyzed_at: "2026-08-13T12:00:00Z" },
    warnings: [],
    evidenceContract: { version: "2.0", findings, sourceDocuments: [], relevantKeywords: [] },
  };
  return {
    runId: id,
    label: id,
    createdAtClient: "2026-08-13T12:00:00Z",
    analysis,
    inputIdentity: id,
    resumeIdentity: id,
    jobIdentity: "job-one",
    reviewState: {},
    notes: {},
    sourceType: "pasted_text",
    ...options,
  };
}

describe("Resume Lab lifecycle", () => {
  it("keeps opaque identities deterministic without retaining source text", () => {
    const inputs = { analysisMode: "Skills-focused analysis" as const, resumeFiles: [], resumeText: "private résumé text", jobFile: null, jobText: "private role text" };
    expect(inputSignature(inputs)).toBe(inputSignature(inputs));
    for (const identity of [inputSignature(inputs), resumeInputIdentity(inputs), jobInputIdentity(inputs)]) {
      expect(identity).toMatch(/^[a-f0-9]{16}$/);
      expect(identity).not.toContain("private");
    }
  });

  it("mirrors manual job-description precedence in the session identity", () => {
    const manual = { analysisMode: "Skills-focused analysis" as const, resumeFiles: [], resumeText: "Python", jobFile: new File(["ignored"], "role.txt"), jobText: "Python SQL" };
    expect(jobInputIdentity(manual)).toBe(jobInputIdentity({ ...manual, jobFile: new File(["different"], "other.txt") }));
  });

  it("bounds distinct variants and total in-memory reruns", () => {
    let runs: AnalysisRun[] = [];
    for (let index = 0; index < MAX_RESUME_VARIANTS; index += 1) {
      const outcome = appendAnalysisRun(runs, run(`run-${index}`, [finding("sql", "missing")]));
      expect(outcome.accepted).toBe(true);
      runs = outcome.runs;
    }
    expect(appendAnalysisRun(runs, run("run-extra", [finding("sql", "missing")])).accepted).toBe(false);

    runs = [];
    for (let index = 0; index < MAX_LAB_RUNS; index += 1) {
      const outcome = appendAnalysisRun(runs, run(`repeat-${index}`, [finding("sql", "missing")], { resumeIdentity: "same-resume" }));
      expect(outcome.accepted).toBe(true);
      runs = outcome.runs;
    }
    expect(appendAnalysisRun(runs, run("repeat-extra", [finding("sql", "missing")], { resumeIdentity: "same-resume" })).accepted).toBe(false);
  });

  it("starts a fresh bounded session when a successful run uses a new job", () => {
    const first = run("first", [finding("sql", "missing")]);
    const next = run("next", [finding("sql", "matched")], { jobIdentity: "job-two" });
    const outcome = appendAnalysisRun([first], next);
    expect(outcome).toMatchObject({ accepted: true, resetForNewJob: true, runs: [next] });
  });
});

describe("comparison semantics", () => {
  it("uses comparison keys for deterministic before/after statuses and category deltas", () => {
    const baseline = run("baseline", [finding("python", "matched"), finding("sql", "missing"), finding("gmp", "matched")]);
    const current = run("current", [finding("python", "matched"), finding("sql", "matched"), finding("gmp", "missing")]);
    const comparison = compareAnalysisRuns(baseline, current);
    expect(comparison.comparable).toBe(true);
    expect(comparison.findings.map((item) => [item.displayTerm, item.status])).toEqual([
      ["python", "unchanged_represented"],
      ["sql", "newly_represented"],
      ["gmp", "no_longer_represented"],
    ]);
    expect(comparison.coverageDelta).toBe(0);
    expect(comparison.categories[0]).toMatchObject({ matchedDelta: 0, totalDelta: 0 });
    expect(compareAnalysisRuns(baseline, current)).toEqual(comparison);
  });

  it("classifies findings that appear or disappear without text-only matching", () => {
    const baseline = run("baseline", [finding("python", "matched"), finding("legacy", "missing")]);
    const current = run("current", [finding("python", "matched"), finding("node.js", "missing")]);
    expect(compareAnalysisRuns(baseline, current).findings.map((item) => [item.comparisonKey, item.status])).toEqual([
      ["skills_focused.concept_coverage:python", "unchanged_represented"],
      ["skills_focused.concept_coverage:legacy", "removed_finding"],
      ["skills_focused.concept_coverage:node.js", "new_finding"],
    ]);
  });

  it("refuses to force relationships across job, mode, or unavailable-contract boundaries", () => {
    const baseline = run("baseline", [finding("sql", "missing")]);
    const otherJob = run("other-job", [finding("sql", "matched")], { jobIdentity: "job-two" });
    expect(compareAnalysisRuns(baseline, otherJob)).toMatchObject({ comparable: false, findings: [], unavailableReason: "Runs use different job descriptions." });
    const otherMode = run("other-mode", [finding("sql", "matched")]);
    otherMode.analysis = { ...otherMode.analysis, analysis_mode: "Full lexical analysis" };
    expect(compareAnalysisRuns(baseline, otherMode).unavailableReason).toBe("Runs use different analysis modes.");
  });

  it("keeps review state per run and does not propagate decisions", () => {
    const baseline = run("baseline", [finding("sql", "missing")], { reviewState: { "finding-sql": "add" }, notes: { "finding-sql": "Verify database work" } });
    const current = run("current", [finding("sql", "missing")]);
    expect(baseline.reviewState).toEqual({ "finding-sql": "add" });
    expect(current.reviewState).toEqual({});
    expect(current.notes).toEqual({});
  });
});