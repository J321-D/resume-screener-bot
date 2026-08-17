"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowDownToLine, Check, ChevronDown, Clipboard, Clock3, FileText, Layers3, LockKeyhole, Printer, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { findingForTerm, type AnalysisResponse, type AnalysisViewModel, type PublicError } from "@/lib/contracts";
import type { ReviewDecisions, ReviewNotes, ReviewOpportunity } from "@/components/review/review-state";
import { ReviewWorkspace } from "@/components/review/review-workspace";
import { AnalysisPlayback } from "./analysis-playback";
import { AnalysisFingerprint } from "./analysis-fingerprint";
import { CoverageRing } from "./coverage-ring";
import { LivingReport } from "./living-report";
import { EvidenceIntelligence } from "./evidence-intelligence";
import { DocumentXRay } from "./document-xray";
import { DiagnosticsExplorer } from "./diagnostics-explorer";
import { SystemTransparency } from "./system-transparency";

interface ResultsDashboardProps {
  result: AnalysisViewModel;
  stale: boolean;
  reporting: boolean;
  reportError: PublicError | null;
  analysisKey: string;
  onDownload: () => void;
  onNewAnalysis: () => void;
  initialSelectedFindingId?: string | null;
  initialReviewDecisions?: ReviewDecisions;
  initialReviewNotes?: ReviewNotes;
  onReviewStateChange?: (decisions: ReviewDecisions, notes: ReviewNotes) => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.2, 0.8, 0.2, 1] as const } },
};

const OPPORTUNITY_LIMIT = 12;
const MATCHED_LIMIT = 16;
type DensityMode = "overview" | "standard" | "dense";
type FindingSelectionOrigin = "xray" | "evidence";

interface TermListProps {
  items: AnalysisResponse["matched_terms"];
  label: string;
  limit: number;
  reduceMotion: boolean | null;
  evidenceFor?: (item: AnalysisResponse["matched_terms"][number]) => string;
  onSelect?: (item: AnalysisResponse["matched_terms"][number]) => void;
  selectedTerm?: string | null;
}

function TermList({ items, label, limit, reduceMotion, evidenceFor, onSelect, selectedTerm }: TermListProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const hasOverflow = items.length > limit;
  const visible = expanded ? items : items.slice(0, limit);
  const hiddenCount = items.length - limit;

  return (
    <>
      <motion.ul layout={!reduceMotion} id={listId} className="term-cloud" aria-label={label}>
        <AnimatePresence initial={false}>
          {visible.map((item, index) => (
            <motion.li
              layout={!reduceMotion}
              initial={reduceMotion ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
              transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : Math.min(index, limit) * 0.018 }}
              tabIndex={onSelect ? undefined : 0}
              title={item.category ?? undefined}
              className={selectedTerm === item.term ? "is-selected" : undefined}
              key={`${item.term}-${item.category}`}
            >
              {onSelect ? (
                <button type="button" aria-pressed={selectedTerm === item.term} onClick={() => onSelect(item)}>
                  <span className="term-name">{item.term}</span>
                  {evidenceFor && <small>{evidenceFor(item)}</small>}
                </button>
              ) : (
                <><span className="term-name">{item.term}</span>{evidenceFor && <small>{evidenceFor(item)}</small>}</>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {hasOverflow && (
        <button
          className="term-toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Show fewer" : `Show ${hiddenCount} more`}
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      )}
    </>
  );
}

export function ResultsDashboard({ result, stale, reporting, reportError, analysisKey, onDownload, onNewAnalysis, initialSelectedFindingId = null, initialReviewDecisions = {}, initialReviewNotes = {}, onReviewStateChange }: ResultsDashboardProps) {
  const reduceMotion = useReducedMotion();
  const resultsRef = useRef<HTMLElement>(null);
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.metadata.analyzed_at));
  const categorized = result.categories.filter((category) => category.category !== "Uncategorized");
  const uncategorized = result.categories.find((category) => category.category === "Uncategorized");
  const isFocused = result.analysis_mode === "Skills-focused analysis";
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [confirmingNew, setConfirmingNew] = useState(false);
  const [focusScope, setFocusScope] = useState<{ category: string; term: string | null } | null>(null);
  const [density, setDensity] = useState<DensityMode>("standard");
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(initialSelectedFindingId);
  const [findingSelectionOrigin, setFindingSelectionOrigin] = useState<FindingSelectionOrigin>("evidence");
  const [reviewDecisions, setReviewDecisions] = useState<ReviewDecisions>(initialReviewDecisions);
  const [reviewNotes, setReviewNotes] = useState<ReviewNotes>(initialReviewNotes);
  const initialReviewDecisionsRef = useRef(initialReviewDecisions);
  const initialReviewNotesRef = useRef(initialReviewNotes);
  const newAnalysisTriggerRef = useRef<HTMLButtonElement>(null);
  const newAnalysisConfirmRef = useRef<HTMLButtonElement>(null);

  async function copySummary() {
    const summary = [
      "Resume Keyword Screener",
      `Mode: ${result.analysis_mode}`,
      `Keyword coverage: ${result.coverage.score === null ? "N/A" : `${result.coverage.score.toFixed(1)}%`}`,
      `Matched: ${result.coverage.matched}`,
      `Coverage opportunities: ${result.coverage.missing}`,
      "Lexical comparison—not a candidate-performance assessment.",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  useEffect(() => {
    const results = resultsRef.current;
    if (!results) return;

    results.focus({ preventScroll: true });
    results.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [analysisKey, reduceMotion]);

  useEffect(() => {
    initialReviewDecisionsRef.current = initialReviewDecisions;
    initialReviewNotesRef.current = initialReviewNotes;
  }, [analysisKey, initialReviewDecisions, initialReviewNotes]);

  useEffect(() => {
    setCopyState("idle");
    setConfirmingNew(false);
    setFocusScope(null);
    setReviewDecisions(stale ? {} : initialReviewDecisionsRef.current);
    setReviewNotes(stale ? {} : initialReviewNotesRef.current);
  }, [analysisKey, stale]);

  useEffect(() => {
    setSelectedFindingId(initialSelectedFindingId);
    setFindingSelectionOrigin("evidence");
  }, [initialSelectedFindingId]);

  useEffect(() => {
    if (!stale) onReviewStateChange?.(reviewDecisions, reviewNotes);
  }, [onReviewStateChange, reviewDecisions, reviewNotes, stale]);

  const reviewOpportunities: ReviewOpportunity[] = result.missing_terms.map((item) => ({
    ...item,
    findingId: findingForTerm(result, "missing", item)?.finding_id,
  }));

  const focusedMatched = focusScope ? result.matched_terms.filter((item) => item.category === focusScope.category) : result.matched_terms;
  const focusedMissing = focusScope
    ? result.missing_terms.filter((item) => item.category === focusScope.category && (!focusScope.term || item.term === focusScope.term))
    : result.missing_terms;

  function matchEvidence(item: AnalysisResponse["matched_terms"][number]) {
    const normalized = result.normalized_matches.some((match) => match.job_term.toLocaleLowerCase() === item.term.toLocaleLowerCase());
    return normalized ? "Normalized match" : "Exact lexical match";
  }

  function focusTerm(item: AnalysisResponse["missing_terms"][number]) {
    const category = item.category ?? "Uncategorized";
    setFocusScope((current) => current?.term === item.term && current.category === category ? null : { category, term: item.term });
    const finding = findingForTerm(result, "missing", item);
    if (finding) selectFinding(finding.finding_id, "evidence");
  }

  function inspectMatchedTerm(item: AnalysisResponse["matched_terms"][number]) {
    const finding = findingForTerm(result, "matched", item);
    if (finding) selectFinding(finding.finding_id, "evidence");
  }

  function selectFinding(findingId: string, origin: FindingSelectionOrigin) {
    setFindingSelectionOrigin(origin);
    setSelectedFindingId(findingId);
  }

  useEffect(() => {
    if (confirmingNew) newAnalysisConfirmRef.current?.focus();
  }, [confirmingNew]);

  function keepCurrentAnalysis() {
    setConfirmingNew(false);
    requestAnimationFrame(() => newAnalysisTriggerRef.current?.focus());
  }

  return (
    <motion.section
      ref={resultsRef}
      className={`results shell density-${density}`}
      aria-labelledby="results-title"
      tabIndex={-1}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } } }}
    >
      <p className="sr-only" role="status" aria-live="polite">Analysis complete. Lexical coverage {result.coverage.score === null ? "not applicable" : `${result.coverage.score.toFixed(1)}%`}. {result.coverage.matched} of {result.coverage.total} terms matched.</p>
      <div className="results-heading">
        <div><p className="eyebrow"><span /> Scan complete</p><h2 id="results-title">Your lexical coverage map</h2></div>
        <div className="results-heading-actions">
          <fieldset className="density-switcher">
            <legend className="sr-only">Result information density</legend>
            {(["overview", "standard", "dense"] as const).map((mode) => (
              <label key={mode}>
                <input type="radio" name="result-density" value={mode} checked={density === mode} onChange={() => setDensity(mode)} />
                <span>{mode}</span>
              </label>
            ))}
          </fieldset>
          <span className="scan-complete"><Check size={14} /> Analysis complete</span>
        </div>
      </div>
      <AnalysisPlayback result={result} reducedMotion={Boolean(reduceMotion)} />
      {stale && (
        <div className="stale-banner" role="status">
          <AlertTriangle size={17} />
          <span><strong>Inputs changed after this scan.</strong> Reanalyze before downloading a report.</span>
        </div>
      )}

      <AnimatePresence initial={false}>
        {focusScope && (
          <motion.aside className="focus-scope" aria-label="Focused evidence view" initial={reduceMotion ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}>
            <div><span>FOCUS MODE</span><strong>{focusScope.term ?? focusScope.category}</strong><small>{focusScope.term ? `${focusScope.category} · isolated review opportunity` : "Category evidence isolated"}</small></div>
            <p>Primary coverage remains unchanged. This view narrows the visible evidence and review queue only.</p>
            <button type="button" onClick={() => setFocusScope(null)}>Clear focus</button>
          </motion.aside>
        )}
      </AnimatePresence>

      <div id="summary" className="result-hero-grid">
        <motion.article className="coverage-card" variants={cardVariants}>
          <CoverageRing score={result.coverage.score} />
          <div className="coverage-copy">
            <p className="mono-label">{result.analysis_mode.toUpperCase()}</p>
            <h3>{result.coverage.label}</h3>
            <p>Lexical overlap across the supplied résumé content and role description. <a className="context-link" href="/methodology#coverage">What does this mean?</a></p>
            <div className="result-meta"><FileText size={15} /><span>{result.metadata.resume_label}</span></div>
            <div className="result-meta"><Layers3 size={15} /><span>{result.metadata.input_mode.replaceAll("_", " ")}</span></div>
            <div className="result-meta"><Clock3 size={15} /><time dateTime={result.metadata.analyzed_at}>{date}</time></div>
            <button className="copy-summary" type="button" onClick={copySummary}><Clipboard size={15} /> Copy summary</button>
            <span className="copy-status" role="status" aria-live="polite">{copyState === "copied" ? "Summary copied." : copyState === "error" ? "Could not access the clipboard. Select and copy the visible results instead." : ""}</span>
          </div>
        </motion.article>

        <div className="metric-stack">
          <motion.article className="metric-card matched" variants={cardVariants}>
            <span>{isFocused ? "CATEGORIZED MATCHED" : "MATCHED"}</span><strong>{result.coverage.matched}</strong><p>{isFocused ? "categorized concepts represented" : "terms already represented"}</p>
          </motion.article>
          <motion.article className="metric-card opportunity" variants={cardVariants}>
            <span>{isFocused ? "CATEGORIZED GAPS" : "OPPORTUNITIES"}</span><strong>{result.coverage.missing}</strong><p>{isFocused ? "categorized concepts to review" : "terms worth reviewing"}</p>
          </motion.article>
          <motion.article className="metric-card" variants={cardVariants}>
            <span>{isFocused ? "CATEGORIZED TOTAL" : "TOTAL"}</span><strong>{result.coverage.total}</strong><p>unique role concepts</p>
          </motion.article>
        </div>
      </div>

      <motion.div id="fingerprint" tabIndex={-1} variants={cardVariants}>
        <AnalysisFingerprint categories={result.categories} coverage={result.coverage} />
      </motion.div>

      <div id="findings" className="terms-grid">
        <motion.article className="terms-card matched-terms" variants={cardVariants}>
          <header><div><span className="result-icon success"><Check size={16} /></span><div><h3>Skills already covered</h3><p>Language detected in both inputs.</p></div></div><strong>{result.matched_terms.length}</strong></header>
          <TermList items={focusedMatched} label="Matched terms" limit={MATCHED_LIMIT} reduceMotion={reduceMotion} evidenceFor={matchEvidence} onSelect={result.evidenceContract.version === "2.0" ? inspectMatchedTerm : undefined} />
          {!focusedMatched.length && <p className="empty-copy">No matched terms were found in this focus.</p>}
        </motion.article>
        <motion.article className="terms-card missing-terms" variants={cardVariants}>
          <header><div><span className="result-icon warning"><Sparkles size={16} /></span><div><h3>Coverage opportunities</h3><p>Consider these terms where they accurately reflect experience.</p></div></div><strong>{result.missing_terms.length}</strong></header>
          <TermList items={focusedMissing} label="Coverage opportunities" limit={OPPORTUNITY_LIMIT} reduceMotion={reduceMotion} onSelect={focusTerm} selectedTerm={focusScope?.term} />
          {!focusedMissing.length && <p className="empty-copy">No missing terms—this lexical comparison is complete.</p>}
        </motion.article>
      </div>

      {(categorized.length > 0 || uncategorized) && (
        <motion.article id="category-signal" tabIndex={-1} className="insight-card" variants={cardVariants}>
          <header><div><span className="result-icon"><Layers3 size={16} /></span><div><h3>Category coverage</h3><p>Coverage across the curated relevance taxonomy. <a className="context-link" href="/help#categories">How categories work</a></p></div></div></header>
          <div className="category-bars">
            {categorized.map((category) => (
              <div className={`category-row ${focusScope?.category === category.category && !focusScope.term ? "is-selected" : ""}`} key={category.category}>
                <button className="category-focus-button" type="button" aria-pressed={focusScope?.category === category.category && !focusScope.term} onClick={() => setFocusScope((current) => current?.category === category.category && !current.term ? null : { category: category.category, term: null })}>
                <div><span>{category.category}</span><strong>{category.display_value}</strong></div>
                <div className="category-track" role="meter" aria-label={`${category.category}: ${category.display_value}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={category.score ?? undefined}>
                  <span style={{ width: `${category.score ?? 0}%` }} />
                </div>
                </button>
              </div>
            ))}
          </div>
          {categorized.length > 0 && (
            <div className="coverage-matrix-wrap">
              <div className="matrix-heading">
                <div><span>DETERMINISTIC COVERAGE MATRIX</span><strong>Category signal map</strong></div>
                <small>Select a row to isolate its returned evidence.</small>
              </div>
              <table className="coverage-matrix">
                <caption className="sr-only">Résumé representation and coverage opportunities by returned analysis category</caption>
                <thead><tr><th scope="col">Category</th><th scope="col">Represented</th><th scope="col">Opportunity</th><th scope="col">Coverage</th></tr></thead>
                <tbody>
                  {categorized.map((category) => {
                    const missing = Math.max(0, category.total - category.matched);
                    const selected = focusScope?.category === category.category && !focusScope.term;
                    return (
                      <tr key={`matrix-${category.category}`} className={selected ? "is-selected" : undefined}>
                        <th scope="row"><button type="button" aria-pressed={selected} onClick={() => setFocusScope((current) => current?.category === category.category && !current.term ? null : { category: category.category, term: null })}>{category.category}</button></th>
                        <td data-state={category.matched > 0 ? "represented" : "none"}><span>{category.matched}</span></td>
                        <td data-state={missing > 0 ? "opportunity" : "none"}><span>{missing}</span></td>
                        <td data-state={category.score === null ? "na" : "coverage"}><strong>{category.display_value}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {uncategorized && (
            <div className="uncategorized-coverage">
              <div>
                <span>Uncategorized lexical coverage</span>
                <strong>{uncategorized.display_value}</strong>
              </div>
              <p>Visible for review and reported separately; excluded from the primary categorized score.</p>
            </div>
          )}
        </motion.article>
      )}

      {result.normalized_matches.length > 0 && (
        <motion.details className="explanation-card" variants={cardVariants}>
          <summary><span><Sparkles size={16} /> Normalized match explanations</span><ChevronDown size={17} /></summary>
          <ul>
            {result.normalized_matches.map((item) => (
              <li key={`${item.concept}-${item.resume_term}-${item.job_term}`}><code>{item.resume_term}</code><span>matched</span><code>{item.job_term}</code><span>as</span><strong>{item.concept}</strong></li>
            ))}
          </ul>
        </motion.details>
      )}

      {result.warnings.length > 0 && (
        <div className="result-warnings" role="status">
          {result.warnings.map((warning) => <p key={`${warning.code}-${warning.message}`}><AlertTriangle size={15} /> {warning.message}</p>)}
        </div>
      )}

      <motion.div variants={cardVariants}>
        <DocumentXRay
          result={result}
          selectedFindingId={selectedFindingId}
          reviewDecisions={reviewDecisions}
          onSelectFinding={(findingId) => selectFinding(findingId, "xray")}
        />
      </motion.div>

      <motion.div variants={cardVariants}>
        <EvidenceIntelligence
          result={result}
          selectedFindingId={selectedFindingId}
          reviewDecisions={reviewDecisions}
          onSelectFinding={(findingId) => selectFinding(findingId, "evidence")}
          focusSelection={findingSelectionOrigin === "evidence"}
        />
      </motion.div>

      <motion.div variants={cardVariants}>
        <DiagnosticsExplorer result={result} onSelectFinding={(findingId) => selectFinding(findingId, "evidence")} />
      </motion.div>

      <div id="review" tabIndex={-1}>
        <ReviewWorkspace
          key={`${analysisKey}:${stale ? "stale" : "current"}`}
          opportunities={reviewOpportunities}
          stale={stale}
          focusCategory={focusScope?.category}
          focusTerm={focusScope?.term}
          onInspectFinding={(findingId) => selectFinding(findingId, "evidence")}
          onDecisionsChange={setReviewDecisions}
          onNotesChange={setReviewNotes}
          initialDecisions={stale ? {} : initialReviewDecisions}
          initialNotes={stale ? {} : initialReviewNotes}
        />
      </div>

      <SystemTransparency result={result} />
      <LivingReport result={result} stale={stale} />

      <motion.article className="export-card" data-reporting={reporting ? "active" : "idle"} variants={cardVariants}>
        <div className="report-thumbnail" aria-hidden="true"><span>RKS</span><div /><div /><div /></div>
        <div className="export-copy"><p className="mono-label">CURRENT INPUT SIGNATURE</p><h3>Export your analysis</h3><p>Download a recruiter-ready PDF generated by the existing Unicode-safe Python report engine. <a className="context-link" href="/help#exports">Export guide</a></p><span><LockKeyhole size={14} /> Generated on request; not intentionally persisted</span></div>
        <div className="export-actions">
          <button id="download-report" className="button button-primary" type="button" disabled={stale || reporting} onClick={onDownload}>
            <ArrowDownToLine size={17} /> {reporting ? "Preparing PDF…" : "Download PDF report"}
          </button>
          <button className="button button-quiet" type="button" onClick={() => window.print()}><Printer size={16} /> Print results</button>
        </div>
      </motion.article>
      {reportError && (
        <div className="export-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          <span><strong>PDF report not created.</strong> {reportError.message} Your current results remain available.</span>
        </div>
      )}

      <div className="results-next-actions">
        <a className="button button-quiet" href="#workspace">Edit current inputs</a>
        {!confirmingNew ? (
          <button id="new-analysis-trigger" ref={newAnalysisTriggerRef} className="button button-quiet" type="button" onClick={() => setConfirmingNew(true)}><RotateCcw size={16} /> New analysis</button>
        ) : (
          <div className="new-analysis-confirmation" role="alertdialog" aria-labelledby="new-analysis-title" onKeyDown={(event) => { if (event.key === "Escape") keepCurrentAnalysis(); }}>
            <strong id="new-analysis-title">Clear current inputs, results, and review decisions?</strong>
            <button ref={newAnalysisConfirmRef} type="button" onClick={onNewAnalysis}>Clear and start new</button>
            <button type="button" onClick={keepCurrentAnalysis}>Keep current analysis</button>
          </div>
        )}
      </div>

      <p className="results-disclaimer">Lexical keyword comparison—not a candidate-performance assessment or hiring recommendation.</p>
    </motion.section>
  );
}
