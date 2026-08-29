"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Binary, Check, ChevronDown, ChevronUp, CircleDot, Clipboard, FileSearch, Filter, GitBranch, ScanSearch, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
type CopyState = "idle" | "represented" | "gaps" | "evidence" | "error";

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

function proofExplanation(status: "matched" | "missing", method: string) {
  if (status === "missing") {
    return "The role concept was detected in the job description, but no résumé evidence occurrence satisfied this deterministic concept. This is a review prompt, not a recommendation to add unsupported experience.";
  }
  if (method === "exact") {
    return "The same supported concept was detected directly in the résumé and job description. The exact returned source surfaces are shown below.";
  }
  return "The concept is represented through an explicit documented phrase or curated alias. No fuzzy, embedding, or generative inference is used.";
}

export function EvidenceIntelligence({ result, selectedFindingId, reviewDecisions, onSelectFinding, focusSelection = true }: EvidenceIntelligenceProps) {
  const reduceMotion = useReducedMotion();
  const inspectorRef = useRef<HTMLElement>(null);
  const resultSearchRef = useRef<HTMLInputElement>(null);
  const copyResetRef = useRef<number | null>(null);
  const [status, setStatus] = useState<EvidenceStatus>("all");
  const [category, setCategory] = useState("all");
  const [source, setSource] = useState("all");
  const [method, setMethod] = useState("all");
  const [review, setReview] = useState("all");
  const [resultsRoot, setResultsRoot] = useState<HTMLElement | null>(null);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [resultQuery, setResultQuery] = useState("");
  const [resultCategory, setResultCategory] = useState("all");
  const [visiblePrimaryCount, setVisiblePrimaryCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const isFocused = result.analysis_mode === "Skills-focused analysis";
  const findings = result.evidenceContract.findings;
  const relevantKeywords = result.evidenceContract.relevantKeywords;
  const selected = findings.find((finding) => finding.finding_id === selectedFindingId) ?? null;
  const selectedKeyword = relevantKeywords.find((keyword) => keyword.keyword_id === selectedKeywordId) ?? null;
  const documents = new Map(result.evidenceContract.sourceDocuments.map((document) => [document.document_id, document]));
  const categories = [...new Set(findings.map((finding) => finding.category ?? "Uncategorized"))];
  const methods = [...new Set(findings.map((finding) => finding.match_method))];
  const sources = [...new Set(findings.flatMap((finding) => finding.evidence.map((item) => item.source_document)))];
  const primaryCategories = result.categories.filter((item) => item.category !== "Uncategorized" && item.total > 0).map((item) => item.category);
  const primaryMatched = isFocused
    ? result.matched_terms.filter((item) => item.category && item.category !== "Uncategorized")
    : result.matched_terms;
  const primaryMissing = isFocused
    ? result.missing_terms.filter((item) => item.category && item.category !== "Uncategorized")
    : result.missing_terms;
  const primaryTermCount = primaryMatched.length + primaryMissing.length;

  const filtered = useMemo(() => findings.filter((finding) => {
    if (status !== "all" && finding.status !== status) return false;
    if (category !== "all" && (finding.category ?? "Uncategorized") !== category) return false;
    if (method !== "all" && finding.match_method !== method) return false;
    if (source !== "all" && !finding.evidence.some((item) => item.source_document === source)) return false;
    if (review !== "all" && reviewDecisions[finding.finding_id] !== review) return false;
    return true;
  }), [category, findings, method, review, reviewDecisions, source, status]);

  async function copyText(kind: Exclude<CopyState, "idle" | "error">, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(kind);
      if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
      copyResetRef.current = window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
    }
  }

  function copyTerms(kind: "represented" | "gaps") {
    const items = kind === "represented" ? primaryMatched : primaryMissing;
    const label = kind === "represented"
      ? (isFocused ? "Curated concepts represented" : "Exact terms shared")
      : (isFocused ? "Curated concepts to review" : "Unmatched JD terms");
    const body = items.length ? items.map((item) => `- ${item.term}`).join("\n") : "- None";
    void copyText(kind, `${label}\n${body}`);
  }

  useEffect(() => () => {
    if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".results");
    setResultsRoot(root);
    if (!root) return;
    root.dataset.analysisMode = isFocused ? "focused" : "full";
    root.dataset.technicalOpen = technicalOpen ? "true" : "false";
    return () => {
      delete root.dataset.analysisMode;
      delete root.dataset.technicalOpen;
    };
  }, [isFocused, technicalOpen, result.metadata.analyzed_at]);

  useEffect(() => {
    setResultQuery("");
    setResultCategory("all");
    setSelectedKeywordId(null);
    setDrawerOpen(false);
    setTechnicalOpen(false);
    setCopyState("idle");
  }, [result.metadata.analyzed_at]);

  useEffect(() => {
    const findingsRoot = document.getElementById("findings");
    if (!findingsRoot) {
      setVisiblePrimaryCount(primaryTermCount);
      return;
    }
    const nodes = Array.from(findingsRoot.querySelectorAll<HTMLLIElement>(".term-cloud li"));
    const query = resultQuery.trim().toLocaleLowerCase();
    let shown = 0;
    for (const node of nodes) {
      const term = (node.querySelector(".term-name")?.textContent ?? node.textContent ?? "").toLocaleLowerCase();
      const itemCategory = node.getAttribute("title") ?? "Uncategorized";
      const categoryMatches = resultCategory === "all" || itemCategory === resultCategory;
      const queryMatches = !query || term.includes(query);
      node.hidden = !(categoryMatches && queryMatches);
      if (!node.hidden) shown += 1;
    }
    setVisiblePrimaryCount(shown || (nodes.length ? 0 : primaryTermCount));
    return () => nodes.forEach((node) => { node.hidden = false; });
  }, [primaryTermCount, resultCategory, resultQuery, result.metadata.analyzed_at]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable)) return;
      if (!resultSearchRef.current) return;
      event.preventDefault();
      resultSearchRef.current.focus();
      resultSearchRef.current.select();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!selectedFindingId || !focusSelection) return;
    inspectorRef.current?.focus({ preventScroll: true });
    inspectorRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    const active = document.activeElement;
    if (active instanceof HTMLElement && (active.closest("#findings") || active.closest("#review"))) {
      setSelectedKeywordId(null);
      setDrawerOpen(true);
    }
  }, [focusSelection, reduceMotion, selectedFindingId]);

  useEffect(() => {
    function activateRelevant(target: EventTarget | null, keyboard = false, key = "") {
      if (!(target instanceof Element)) return;
      if (keyboard && key !== "Enter" && key !== " ") return;
      const item = target.closest("#relevant-keyword-review .term-cloud li");
      if (!item) return;
      const visibleTerm = item.querySelector(".term-name")?.textContent?.trim().toLocaleLowerCase();
      if (!visibleTerm) return;
      const keyword = relevantKeywords.find((candidate) => (
        candidate.normalized_term.toLocaleLowerCase() === visibleTerm
        || candidate.display_term.toLocaleLowerCase() === visibleTerm
      ));
      if (!keyword) return;
      if (keyboard) (target as HTMLElement).click?.();
      setSelectedKeywordId(keyword.keyword_id);
      setDrawerOpen(true);
    }
    const onClick = (event: MouseEvent) => activateRelevant(event.target);
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("#relevant-keyword-review .term-cloud li")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      activateRelevant(target, true, event.key);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [relevantKeywords]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const toolbar = resultsRoot ? createPortal(
    <div className="results-polish-toolbar" aria-label="Result search and filters">
      <label className="results-polish-search">
        <Search size={15} aria-hidden="true" />
        <span className="sr-only">Search returned terms</span>
        <input ref={resultSearchRef} aria-keyshortcuts="/" value={resultQuery} onChange={(event) => setResultQuery(event.target.value)} placeholder="Search returned terms" />
        <kbd className="results-polish-shortcut" aria-hidden="true">/</kbd>
      </label>
      <div className="results-polish-actions">
        <button type="button" data-copy-state={copyState === "represented" ? "copied" : "idle"} onClick={() => copyTerms("represented")}><Clipboard size={13} aria-hidden="true" /> {copyState === "represented" ? "Copied represented" : "Copy represented"}</button>
        <button type="button" data-copy-state={copyState === "gaps" ? "copied" : "idle"} onClick={() => copyTerms("gaps")}><Clipboard size={13} aria-hidden="true" /> {copyState === "gaps" ? "Copied gaps" : "Copy gaps"}</button>
        <a href="#workspace"><SlidersHorizontal size={13} aria-hidden="true" /> Compare modes</a>
        <a href="#review">Review gaps</a>
      </div>
      {isFocused && primaryCategories.length > 0 && (
        <div className="results-polish-categories" role="group" aria-label="Filter returned concepts by category">
          <button className="results-polish-chip" type="button" aria-pressed={resultCategory === "all"} onClick={() => setResultCategory("all")}>All categories</button>
          {primaryCategories.map((item) => (
            <button className="results-polish-chip" type="button" aria-pressed={resultCategory === item} onClick={() => setResultCategory(item)} key={item}>{item}</button>
          ))}
        </div>
      )}
      <p className="results-polish-status" role="status">Showing {visiblePrimaryCount} of {primaryTermCount} primary returned terms. Search and filters change presentation only.</p>
      <span className="results-polish-copy-status" role="status" aria-live="polite">{copyState === "error" ? "Clipboard unavailable. Use the visible lists to copy manually." : ""}</span>
    </div>,
    resultsRoot,
  ) : null;

  const technicalToggle = resultsRoot ? createPortal(
    <button className="technical-details-toggle" type="button" aria-expanded={technicalOpen} onClick={() => setTechnicalOpen((current) => !current)}>
      <span><strong>Technical details</strong><small>Walkthrough, fingerprint, source X-Ray, TRACE, diagnostics, and system transparency</small></span>
      {technicalOpen ? <ChevronUp size={17} aria-hidden="true" /> : <ChevronDown size={17} aria-hidden="true" />}
    </button>,
    resultsRoot,
  ) : null;

  const mobileNav = resultsRoot ? createPortal(
    <nav className="results-mobile-nav" aria-label="Result sections">
      <a href="#summary">Score</a>
      <a href="#findings">Terms</a>
      <a href="#review">Review</a>
      <a href="#living-report">Report</a>
    </nav>,
    resultsRoot,
  ) : null;

  const drawerFinding = selectedKeyword ? null : selected;
  const drawerStatus = selectedKeyword?.status ?? drawerFinding?.status ?? null;
  const drawerMethod = selectedKeyword?.match_method ?? drawerFinding?.match_method ?? null;
  const drawerTitle = selectedKeyword?.display_term ?? drawerFinding?.display_term ?? null;
  const drawerCategory = selectedKeyword?.category ?? drawerFinding?.category ?? null;

  function copyDrawerEvidence() {
    if (!drawerTitle || !drawerStatus || !drawerMethod) return;
    const selectedEvidence = selectedKeyword?.evidence.map((evidence) => ({
      source: sourceLabel[evidence.source_document],
      surface: evidence.matched_surface,
      documentId: evidence.document_id,
      start: evidence.source_span.start,
      end: evidence.source_span.end,
    })) ?? drawerFinding?.evidence.map((evidence) => ({
      source: sourceLabel[evidence.source_document],
      surface: evidence.matched_surface,
      documentId: evidence.document_id,
      start: evidence.source_span.start,
      end: evidence.source_span.end,
    })) ?? [];
    const lines = [
      `${drawerStatus === "matched" ? "Why this matched" : "Why this is missing"}: ${drawerTitle}`,
      `Category: ${drawerCategory ?? "Uncategorized"}`,
      `Method: ${drawerMethod.replaceAll("_", " ")}`,
      ...selectedEvidence.map((evidence) => `${evidence.source}: ${evidence.surface} (${evidence.documentId} [${evidence.start}, ${evidence.end}))`),
    ];
    void copyText("evidence", lines.join("\n"));
  }

  const drawer = drawerOpen && drawerTitle && typeof document !== "undefined" ? createPortal(
    <motion.aside
      className="evidence-proof-drawer"
      role="dialog"
      aria-modal="false"
      aria-label={`${drawerStatus === "matched" ? "Why this matched" : "Why this is missing"}: ${drawerTitle}`}
      initial={reduceMotion ? false : { opacity: 0, x: 18, scale: .99 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: 12, scale: .995 }}
      transition={{ duration: reduceMotion ? 0 : .22, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header>
        <div><p className="mono-label">{drawerStatus === "matched" ? "WHY THIS MATCHED" : "WHY THIS IS MISSING"}</p><h3>{drawerTitle}</h3></div>
        <button className="evidence-proof-close" type="button" aria-label="Close evidence drawer" onClick={() => setDrawerOpen(false)}><X size={17} /></button>
      </header>
      <div className="evidence-proof-meta">
        <span>{drawerCategory ?? "Uncategorized"}</span>
        <span>{drawerMethod?.replaceAll("_", " ")}</span>
        <span>{drawerStatus === "matched" ? "Represented" : "Not detected"}</span>
      </div>
      <p className="evidence-proof-explanation">{proofExplanation(drawerStatus ?? "missing", drawerMethod ?? "not_detected")}</p>
      <div className="evidence-proof-sources">
        {selectedKeyword?.evidence.map((evidence, index) => (
          <div className="evidence-proof-source" key={`${selectedKeyword.keyword_id}-${evidence.document_id}-${evidence.source_span.start}-${index}`}>
            <span>{sourceLabel[evidence.source_document]}</span>
            <strong>{evidence.matched_surface}</strong>
            <code>{evidence.document_id} · [{evidence.source_span.start}, {evidence.source_span.end})</code>
          </div>
        ))}
        {drawerFinding?.evidence.map((evidence) => (
          <div className="evidence-proof-source" key={evidence.evidence_id}>
            <span>{sourceLabel[evidence.source_document]}</span>
            <strong>{evidence.matched_surface}</strong>
            <code>{evidence.document_id} · [{evidence.source_span.start}, {evidence.source_span.end}) · {sectionLabel(evidence.source_section)}</code>
          </div>
        ))}
      </div>
      {selectedKeyword && !selectedKeyword.evidence.length && <p className="evidence-proof-empty">No exact evidence occurrence was returned for this curated keyword.</p>}
      {drawerFinding && !drawerFinding.evidence.length && <p className="evidence-proof-empty">{unknownLabel(drawerFinding.unavailable_evidence_reason ?? "not_available")}</p>}
      <div className="evidence-proof-copy">
        <button type="button" onClick={copyDrawerEvidence}>{copyState === "evidence" ? <Check size={14} aria-hidden="true" /> : <Clipboard size={14} aria-hidden="true" />} {copyState === "evidence" ? "Evidence copied" : "Copy evidence"}</button>
        <span className="results-polish-copy-status" role="status" aria-live="polite">{copyState === "error" ? "Clipboard unavailable." : ""}</span>
      </div>
      <p className="evidence-proof-footer">Evidence is literal request-scoped provenance. The drawer does not infer experience, requirement severity, candidate quality, or hiring likelihood.</p>
    </motion.aside>,
    document.body,
  ) : null;

  if (result.evidenceContract.version === "unavailable") {
    return (
      <>
        {toolbar}{technicalToggle}{mobileNav}
        <section id="evidence-explorer" className="evidence-intelligence" aria-labelledby="evidence-title">
          <header><div><span className="mono-label">CONTRACT V2</span><h3 id="evidence-title">Evidence intelligence unavailable</h3></div></header>
          <p className="evidence-empty">This response used the compatibility contract. Coverage remains valid, but authoritative TRACE fields were not returned.</p>
        </section>
      </>
    );
  }

  return (
    <>
      {toolbar}{technicalToggle}{mobileNav}{drawer}
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
    </>
  );
}
