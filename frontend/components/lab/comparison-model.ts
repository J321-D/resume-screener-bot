import type { AnalysisFinding, AnalysisViewModel } from "@/lib/contracts";
import type { ReviewDecisions, ReviewNotes } from "@/components/review/review-state";

export const MAX_LAB_RUNS = 5;
export const MAX_RESUME_VARIANTS = 3;

export type AnalysisRunSource =
  | "uploaded_document"
  | "pasted_text"
  | "combined_sources"
  | "temporary_text_revision"
  | "fictional_demo";

export interface AnalysisRun {
  runId: string;
  label: string;
  createdAtClient: string;
  analysis: AnalysisViewModel;
  inputIdentity: string;
  resumeIdentity: string;
  jobIdentity: string;
  reviewState: ReviewDecisions;
  notes: ReviewNotes;
  sourceType: AnalysisRunSource;
}

export type FindingComparisonStatus =
  | "unchanged_represented"
  | "unchanged_review_item"
  | "newly_represented"
  | "no_longer_represented"
  | "new_finding"
  | "removed_finding";

export interface ComparisonFinding {
  comparisonKey: string;
  status: FindingComparisonStatus;
  displayTerm: string;
  category: string | null;
  baseline: AnalysisFinding | null;
  current: AnalysisFinding | null;
}

export interface CategoryComparison {
  category: string;
  baselineMatched: number;
  baselineTotal: number;
  currentMatched: number;
  currentTotal: number;
  matchedDelta: number;
  totalDelta: number;
}

export interface RunComparison {
  comparisonId: string;
  baseline: AnalysisRun;
  current: AnalysisRun;
  comparable: boolean;
  unavailableReason: string | null;
  coverageDelta: number | null;
  findings: ComparisonFinding[];
  categories: CategoryComparison[];
  evidenceDelta: number;
}

export interface AppendRunResult {
  runs: AnalysisRun[];
  accepted: boolean;
  resetForNewJob: boolean;
  message: string | null;
}

export function appendAnalysisRun(existing: AnalysisRun[], candidate: AnalysisRun): AppendRunResult {
  const sameJobRuns = existing.filter((run) => run.jobIdentity === candidate.jobIdentity);
  const resetForNewJob = existing.length > 0 && sameJobRuns.length === 0;
  const base = resetForNewJob ? [] : existing;
  const distinctResumeIdentities = new Set(base.map((run) => run.resumeIdentity));

  if (!distinctResumeIdentities.has(candidate.resumeIdentity) && distinctResumeIdentities.size >= MAX_RESUME_VARIANTS) {
    return {
      runs: base,
      accepted: false,
      resetForNewJob,
      message: `Resume Lab supports ${MAX_RESUME_VARIANTS} distinct résumé variants for one role. Clear the session or rerun an existing variant.`,
    };
  }
  if (base.length >= MAX_LAB_RUNS) {
    return {
      runs: base,
      accepted: false,
      resetForNewJob,
      message: `Resume Lab retains at most ${MAX_LAB_RUNS} runs. Clear the session before adding another run.`,
    };
  }
  return {
    runs: [...base, candidate],
    accepted: true,
    resetForNewJob,
    message: resetForNewJob ? "A new job description started a new Resume Lab session." : null,
  };
}

function findingsByKey(run: AnalysisRun) {
  return new Map(run.analysis.evidenceContract.findings.map((finding) => [finding.comparison_key, finding]));
}

function comparisonStatus(baseline: AnalysisFinding | null, current: AnalysisFinding | null): FindingComparisonStatus {
  if (!baseline) return "new_finding";
  if (!current) return "removed_finding";
  if (baseline.status === "missing" && current.status === "matched") return "newly_represented";
  if (baseline.status === "matched" && current.status === "missing") return "no_longer_represented";
  return current.status === "matched" ? "unchanged_represented" : "unchanged_review_item";
}

export function compareAnalysisRuns(baseline: AnalysisRun, current: AnalysisRun): RunComparison {
  const comparable = baseline.jobIdentity === current.jobIdentity
    && baseline.analysis.analysis_mode === current.analysis.analysis_mode
    && baseline.analysis.evidenceContract.version === "2.0"
    && current.analysis.evidenceContract.version === "2.0";
  const unavailableReason = baseline.jobIdentity !== current.jobIdentity
    ? "Runs use different job descriptions."
    : baseline.analysis.analysis_mode !== current.analysis.analysis_mode
    ? "Runs use different analysis modes."
    : baseline.analysis.evidenceContract.version !== "2.0" || current.analysis.evidenceContract.version !== "2.0"
    ? "Authoritative Contract v2 findings are unavailable for one or both runs."
    : null;

  const baselineFindings = findingsByKey(baseline);
  const currentFindings = findingsByKey(current);
  const keys = [...baselineFindings.keys(), ...[...currentFindings.keys()].filter((key) => !baselineFindings.has(key))];
  const findings = comparable ? keys.map((comparisonKey) => {
    const before = baselineFindings.get(comparisonKey) ?? null;
    const after = currentFindings.get(comparisonKey) ?? null;
    return {
      comparisonKey,
      status: comparisonStatus(before, after),
      displayTerm: after?.display_term ?? before?.display_term ?? comparisonKey,
      category: after?.category ?? before?.category ?? null,
      baseline: before,
      current: after,
    };
  }) : [];

  const baselineCategories = new Map(baseline.analysis.categories.map((category) => [category.category, category]));
  const currentCategories = new Map(current.analysis.categories.map((category) => [category.category, category]));
  const categoryNames = [...baselineCategories.keys(), ...[...currentCategories.keys()].filter((name) => !baselineCategories.has(name))];
  const categories = comparable ? categoryNames.map((category) => {
    const before = baselineCategories.get(category);
    const after = currentCategories.get(category);
    return {
      category,
      baselineMatched: before?.matched ?? 0,
      baselineTotal: before?.total ?? 0,
      currentMatched: after?.matched ?? 0,
      currentTotal: after?.total ?? 0,
      matchedDelta: (after?.matched ?? 0) - (before?.matched ?? 0),
      totalDelta: (after?.total ?? 0) - (before?.total ?? 0),
    };
  }) : [];
  const baselineEvidence = baseline.analysis.evidenceContract.findings.reduce((total, finding) => total + finding.evidence.length, 0);
  const currentEvidence = current.analysis.evidenceContract.findings.reduce((total, finding) => total + finding.evidence.length, 0);
  const beforeScore = baseline.analysis.coverage.score;
  const afterScore = current.analysis.coverage.score;

  return {
    comparisonId: `${baseline.runId}::${current.runId}`,
    baseline,
    current,
    comparable,
    unavailableReason,
    coverageDelta: comparable && beforeScore !== null && afterScore !== null ? Number((afterScore - beforeScore).toFixed(1)) : null,
    findings,
    categories,
    evidenceDelta: comparable ? currentEvidence - baselineEvidence : 0,
  };
}

export function unresolvedReviewCount(run: AnalysisRun) {
  return run.analysis.missing_terms.filter((term) => {
    const finding = run.analysis.evidenceContract.findings.find((item) => item.status === "missing" && item.display_term === term.term && item.category === term.category);
    const decision = finding ? run.reviewState[finding.finding_id] : undefined;
    return !decision || decision === "later";
  }).length;
}
