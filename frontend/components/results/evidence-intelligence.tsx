"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Binary, ChevronDown, CircleDot, FileSearch, Filter, GitBranch, ScanSearch } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AnalysisFinding, AnalysisViewModel } from "@/lib/contracts";
import type { ReviewDecisions } from "@/components/review/review-state";

interface EvidenceIntelligenceProps {
  result: AnalysisViewModel;
  selectedFindingId: string | null;
  reviewDecisions: ReviewDecisions;
  onSelectFinding: (findingId: string) => void;
  focusSelection?: boolean;
}

type EvidenceStatus = "all" | AnalysisFinding["status"];

const sourceLabel = {
  resume: "Résumé",
  job_description: "Job description",
} as const;

function unknownLabel(reason: string) {
  return `Unavailable — ${reason.replaceAll("_", " ")}`;
}

function sectionLabel(section: AnalysisFinding["evidence"][number]["source_section"]) {
  return "section_id" in section
    ? `${section.raw_heading} · ${section.normalized_type}`
    : unknownLabel(section.unknown_reason);
}

export function EvidenceIntelligence({ result, selectedFindingId, reviewDecisions, onSelectFinding, focusSelection = true }: EvidenceIntelligenceProps) {
  const reduceMotion = useReducedMotion();
  const inspectorRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<EvidenceStatus>("all");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [method, setMethod] = useState("all");
  const [review, setReview] = useState("all");
  const findings = result.evidenceContract.findings;
  const selected = findings.find((finding) => finding.finding_id === selectedFindingId) ?? null;
  const documents = new Map(result.evidenceContract.sourceDocuments.map((document) => [document.document_id, document]));
  const categories = [...new Set(findings.map((finding) => finding.category ?? "Uncategorized"))];
  const methods = [...new Set(findings.map((finding) => finding.match_method))];
  const sources = [...new Set(findings.flatMap((finding) => finding.evidence.map((item) => item.source_document)))];
  const filtered = useMemo(() => findings.filter((finding) => {
    if (status !== "all" && finding.status !== status) return false;
    if (category !== "all" && (finding.category ?? "Uncategorized") !== category) return false;
    if (method !== "all" && finding.match_method !== method) return false;
    if (source !== "all" && !finding.evidence.some((item) => item.source_document === source)) return false;
    if (review !== "all" && reviewDecisions[finding.finding_id] !== review) return false;
    return true;
  }), [category, findings, method, review, reviewDecisions, source, status]);

  useEffect(() => {
    if (!selectedFindingId || !focusSelection) return;
    inspectorRef.current?.focus({ preventScroll: true });
    inspectorRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  }, [focusSelection, reduceMotion, selectedFindingId]);

  if (result.evidenceContract.version === "unavailable") {
    return (
      <section id="evidence-explorer" className="evidence-intelligence" aria-labelledby="evidence-title">
        <header><div><span className="mono-label">CONTRACT V2</span><h3 id="evidence-title">Evidence intelligence unavailable</h3></div></header>
        <p className="evidence-empty">This response used the compatibility contract. Coverage remains valid, but authoritative TRACE fields were not returned.</p>
      </section>
    );
  }

  return (
    <section id="evidence-explorer" className="evidence-intelligence" aria-labelledby="evidence-title">
      <header>
        <div><span className="mono-label">EVIDENCE INTELLIGENCE // CONTRACT 2.0</span><h3 id="evidence-title">TRACE &amp; provenance</h3><p>Inspect deterministic findings, match methods, exact surfaces, and authoritative coordinates returned by the API.</p></div>
        <span>{findings.length} findings · {findings.reduce((total, finding) => total + finding.evidence.length, 0)} evidence records</span>
      </header>

      <div className="evidence-filter-grid" aria-label="Evidence Explorer filters">
        <label><Filter size={13} /><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as EvidenceStatus)}><option value="all">All</option><option value="matched">Represented</option><option value="missing">Not detected</option></select></label>
        <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
        <label><span>Source</span><select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">All</option>{sources.map((item) => <option value={item} key={item}>{sourceLabel[item]}</option>)}</select></label>
        <label><span>Method</span><select value={method} onChange={(event) => setMethod(event.target.value)}><option value="all">All</option>{methods.map((item) => <option value={item} key={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
        <label><span>Review</span><select value={review} onChange={(event) => setReview(event.target.value)}><option value="all">All</option><option value="add">Add to résumé</option><option value="represented">Already represented</option><option value="not_relevant">Not relevant</option><option value="later">Review later</option></select></label>
      </div>

      <div className="evidence-layout">
        <ul className="evidence-list" aria-label="Authoritative findings">
          {filtered.map((finding) => (
            <li key={finding.finding_id}>
              <button type="button" aria-pressed={finding.finding_id === selectedFindingId} onClick={() => onSelectFinding(finding.finding_id)}>
                <span data-status={finding.status}>{finding.status === "matched" ? "REPRESENTED" : "NOT DETECTED"}</span>
                <strong>{finding.display_term}</strong>
                <small>{finding.category ?? "Uncategorized"} · {finding.match_method.replaceAll("_", " ")}</small>
              </button>
            </li>
          ))}
          {!filtered.length && <p className="evidence-empty">No authoritative findings match these filters.</p>}
        </ul>

        <AnimatePresence mode="wait">
          {selected ? (
            <motion.article
              ref={inspectorRef}
              key={selected.finding_id}
              className="provenance-inspector"
              tabIndex={-1}
              aria-labelledby="provenance-title"
              initial={reduceMotion ? false : { opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -6 }}
            >
              <header><div><span className="mono-label">SELECTED FINDING</span><h4 id="provenance-title">{selected.display_term}</h4></div><code>{selected.finding_id}</code></header>
              <ol className="trace-flow" aria-label={`TRACE for ${selected.display_term}`}>
                <li><CircleDot /><span><small>Finding</small><strong>{selected.status}</strong><code>{selected.comparison_key}</code></span></li>
                <li><GitBranch /><span><small>Match method</small><strong>{selected.match_method.replaceAll("_", " ")}</strong><code>{selected.rule_id}</code></span></li>
                {selected.evidence.map((evidence) => {
                  const document = documents.get(evidence.document_id);
                  return (
                    <li key={evidence.evidence_id}><FileSearch /><span><small>{sourceLabel[evidence.source_document]} evidence</small><strong>{evidence.matched_surface}</strong><code>{evidence.document_id} · [{evidence.source_span.start}, {evidence.source_span.end})</code><em>{sectionLabel(evidence.source_section)}</em>{document && <em>{document.canonical_text_characters.toLocaleString()} canonical characters</em>}</span></li>
                  );
                })}
                {!selected.evidence.length && <li><ScanSearch /><span><small>Source evidence</small><strong>{unknownLabel(selected.unavailable_evidence_reason ?? "not_available")}</strong></span></li>}
              </ol>

              <details className="machine-view">
                <summary><span><Binary size={15} /> Machine View</span><ChevronDown size={15} /></summary>
                <p>Deterministic evidence representation—not an AI reasoning trace.</p>
                <dl>
                  <div><dt>Display term</dt><dd>{selected.display_term}</dd></div>
                  <div><dt>Normalized term</dt><dd>{selected.normalized_term}</dd></div>
                  <div><dt>Status reason</dt><dd>{selected.reason.replaceAll("_", " ")}</dd></div>
                  <div><dt>Comparison key</dt><dd><code>{selected.comparison_key}</code></dd></div>
                  <div><dt>Section</dt><dd>{selected.evidence[0] ? sectionLabel(selected.evidence[0].source_section) : "Unavailable — no evidence occurrence"}</dd></div>
                  <div><dt>Structure / formatting</dt><dd>Unavailable — parser limitation</dd></div>
                </dl>
              </details>
            </motion.article>
          ) : (
            <motion.div className="provenance-empty" key="empty"><GitBranch size={22} /><strong>Select a finding to activate TRACE.</strong><span>The inspector will show returned IDs, methods, exact surfaces, sources, and offsets only.</span></motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
