"use client";

import { BookOpenText, ChevronDown, LockKeyhole } from "lucide-react";

import type { AnalysisResponse, AnalysisViewModel } from "@/lib/contracts";

interface LivingReportProps {
  result: AnalysisResponse | AnalysisViewModel;
  stale: boolean;
}

const SCREEN_REPORT_TERM_LIMIT = 50;

export function LivingReport({ result, stale }: LivingReportProps) {
  const isFocused = result.analysis_mode === "Skills-focused analysis";
  const applicable = result.categories.filter(
    (category) =>
      category.total > 0 &&
      (!isFocused || category.category !== "Uncategorized"),
  );
  const reportMatchedTerms = isFocused
    ? result.matched_terms.filter((item) => item.category && item.category !== "Uncategorized")
    : result.matched_terms;
  const reportMissingTerms = isFocused
    ? result.missing_terms.filter((item) => item.category && item.category !== "Uncategorized")
    : result.missing_terms;
  const reportTitle = isFocused ? result.coverage.label : "Raw Lexical Overlap";
  const reportSections = isFocused
    ? ["Categorized score", "Category record", "Curated concepts represented", "Curated concepts to review"]
    : ["Raw lexical score", "Exact terms shared", "Unmatched JD terms", "Relevant Keyword Review"];

  return (
    <details id="living-report" className="living-report" tabIndex={-1}>
      <summary><span><BookOpenText size={17} /><span><strong>Report preview</strong><small>Living Report · inspect the screen record before requesting the PDF</small></span></span><ChevronDown size={17} /></summary>
      <div className="living-report-body">
        <header><p className="mono-label">REPORT PREVIEW // LIVE ANALYSIS RECORD</p><h3>{reportTitle}</h3><strong>{result.coverage.score === null ? "N/A" : `${result.coverage.score.toFixed(1)}%`}</strong><p>{result.analysis_mode} · {result.metadata.resume_label}</p></header>
        {stale && <p className="living-report-stale" role="status">Inputs changed after this result. This preview remains visible as prior output; regenerate before export.</p>}
        <section className="living-report-provenance"><h4>PDF section map</h4><p>The protected PDF uses the same mode-specific terminology shown here: {reportSections.join(" · ")}.</p></section>
        <dl className="living-report-metrics">
          <div><dt>{isFocused ? "Categorized represented" : "Exact terms shared"}</dt><dd>{result.coverage.matched}</dd></div><div><dt>{isFocused ? "Categorized gaps" : "Unmatched JD terms"}</dt><dd>{result.coverage.missing}</dd></div><div><dt>{isFocused ? "Categorized total" : "Unique JD terms"}</dt><dd>{result.coverage.total}</dd></div>
        </dl>
        <section className="living-report-provenance">
          <h4>Evidence contract</h4>
          {"evidenceContract" in result && result.evidenceContract.version === "2.0" ? (
            <p>{result.evidenceContract.findings.length} deterministic findings with exact canonical source text and half-open Unicode offsets. {result.evidenceContract.sourceDocuments.reduce((total, document) => total + document.sections.length, 0)} conservative semantic sections and {result.evidenceContract.diagnostics?.length ?? 0} factual diagnostics were returned for this request.</p>
          ) : (
            <p>Authoritative evidence fields were unavailable for this compatibility response. Coverage remains valid.</p>
          )}
        </section>
        <section><h4>Category record</h4>{applicable.length ? <ul>{applicable.map((category) => <li key={category.category}><span>{category.category}</span><strong>{category.matched} / {category.total}</strong><small>{category.display_value}</small></li>)}</ul> : <p>No applicable categorized concepts were returned.</p>}</section>
        <div className="living-report-columns">
          <section><h4>{isFocused ? "Curated concepts represented" : "Exact terms shared"}</h4>{reportMatchedTerms.length ? <><ol>{reportMatchedTerms.slice(0, SCREEN_REPORT_TERM_LIMIT).map((item) => <li key={`${item.term}-${item.category}`}><span>{item.term}</span><small>{item.category ?? "Uncategorized"}</small></li>)}</ol>{reportMatchedTerms.length > SCREEN_REPORT_TERM_LIMIT && <p className="living-report-limit">First {SCREEN_REPORT_TERM_LIMIT} of {reportMatchedTerms.length}, preserving engine order.</p>}</> : <p>None returned.</p>}</section>
          <section><h4>{isFocused ? "Curated concepts to review" : "Unmatched JD terms"}</h4>{reportMissingTerms.length ? <><ol>{reportMissingTerms.slice(0, SCREEN_REPORT_TERM_LIMIT).map((item) => <li key={`${item.term}-${item.category}`}><span>{item.term}</span><small>{item.category ?? "Uncategorized"}</small></li>)}</ol>{reportMissingTerms.length > SCREEN_REPORT_TERM_LIMIT && <p className="living-report-limit">First {SCREEN_REPORT_TERM_LIMIT} of {reportMissingTerms.length}, preserving engine order.</p>}</> : <p>None returned.</p>}</section>
        </div>
        <footer><LockKeyhole size={15} /><p>This preview is assembled locally from the current API response and is not saved. The downloadable PDF remains generated on request by the existing protected server report engine.</p></footer>
      </div>
    </details>
  );
}
