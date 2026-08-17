import type { AnalysisResponse } from "@/lib/contracts";

export const reviewStatuses = ["add", "represented", "not_relevant", "later"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];
export type ReviewFilter = "all" | "unreviewed" | ReviewStatus;
export type ReviewDecisions = Record<string, ReviewStatus>;
export type ReviewNotes = Record<string, string>;
export type ReviewOpportunity = AnalysisResponse["missing_terms"][number] & {
  findingId?: string;
};

export const reviewLabels: Record<ReviewStatus, string> = {
  add: "Add to résumé",
  represented: "Already represented",
  not_relevant: "Not relevant",
  later: "Review later",
};

export function reviewItemId(index: number, findingId?: string): string {
  return findingId ?? String(index);
}

export function reviewSummary(total: number, decisions: ReviewDecisions) {
  const summary = { total, reviewed: 0, remaining: total, add: 0, represented: 0, not_relevant: 0, later: 0 };
  Object.values(decisions).forEach((status) => {
    summary[status] += 1;
    summary.reviewed += 1;
  });
  summary.remaining = Math.max(0, total - summary.reviewed);
  return summary;
}

export function unresolvedOpportunities(
  opportunities: ReviewOpportunity[],
  decisions: ReviewDecisions,
) {
  return opportunities
    .map((opportunity, index) => ({ opportunity, index, id: reviewItemId(index, opportunity.findingId) }))
    .filter(({ id }) => !decisions[id] || decisions[id] === "later");
}

export function filteredOpportunities(
  opportunities: ReviewOpportunity[],
  decisions: ReviewDecisions,
  filter: ReviewFilter,
  query: string,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return opportunities
    .map((opportunity, index) => ({ opportunity, index, id: reviewItemId(index, opportunity.findingId) }))
    .filter(({ opportunity, id }) => {
      const status = decisions[id];
      const matchesFilter = filter === "all"
        || (filter === "unreviewed" ? !status : status === filter);
      const matchesQuery = !normalizedQuery
        || opportunity.term.toLocaleLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
}

export function actionChecklist(
  opportunities: ReviewOpportunity[],
  decisions: ReviewDecisions,
): string {
  const selected = opportunities.filter((item, index) => decisions[reviewItemId(index, item.findingId)] === "add");
  const safeTerm = (term: string) => term
    .replaceAll("\\", "\\\\")
    .replace(/[\r\n\u2028\u2029]+/g, " ")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]");
  return [
    "# Résumé action checklist",
    "",
    "Review these terms and add them only where they truthfully reflect your experience.",
    "",
    ...(selected.length ? selected.map((item) => `- [ ] ${safeTerm(item.term)}`) : ["- No terms selected."]),
    "",
    "Generated from a lexical comparison—not a candidate-performance assessment.",
  ].join("\n");
}
