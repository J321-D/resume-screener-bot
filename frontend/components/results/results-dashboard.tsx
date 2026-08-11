"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowDownToLine, Check, ChevronDown, Clipboard, Clock3, FileText, Layers3, LockKeyhole, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import type { AnalysisResponse } from "@/lib/contracts";
import { ReviewWorkspace } from "@/components/review/review-workspace";
import { CoverageRing } from "./coverage-ring";

interface ResultsDashboardProps {
  result: AnalysisResponse;
  stale: boolean;
  reporting: boolean;
  analysisKey: string;
  onDownload: () => void;
  onNewAnalysis: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.2, 0.8, 0.2, 1] as const } },
};

const OPPORTUNITY_LIMIT = 12;
const MATCHED_LIMIT = 16;

interface TermListProps {
  items: AnalysisResponse["matched_terms"];
  label: string;
  limit: number;
  reduceMotion: boolean | null;
}

function TermList({ items, label, limit, reduceMotion }: TermListProps) {
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
              tabIndex={0}
              title={item.category ?? undefined}
              key={`${item.term}-${item.category}`}
            >{item.term}</motion.li>
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

export function ResultsDashboard({ result, stale, reporting, analysisKey, onDownload, onNewAnalysis }: ResultsDashboardProps) {
  const reduceMotion = useReducedMotion();
  const resultsRef = useRef<HTMLElement>(null);
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.metadata.analyzed_at));
  const categorized = result.categories.filter((category) => category.category !== "Uncategorized");
  const isFocused = result.analysis_mode === "Skills-focused analysis";
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [confirmingNew, setConfirmingNew] = useState(false);

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

  return (
    <motion.section
      ref={resultsRef}
      className="results shell"
      aria-labelledby="results-title"
      tabIndex={-1}
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } } }}
    >
      <p className="sr-only" role="status" aria-live="polite">Analysis complete. Lexical coverage {result.coverage.score === null ? "not applicable" : `${result.coverage.score.toFixed(1)}%`}. {result.coverage.matched} of {result.coverage.total} terms matched.</p>
      <div className="results-heading">
        <div><p className="eyebrow"><span /> Scan complete</p><h2 id="results-title">Your lexical coverage map</h2></div>
        <span className="scan-complete"><Check size={14} /> Analysis complete</span>
      </div>
      {stale && (
        <div className="stale-banner" role="status">
          <AlertTriangle size={17} />
          <span><strong>Inputs changed after this scan.</strong> Reanalyze before downloading a report.</span>
        </div>
      )}

      <div id="summary" className="result-hero-grid">
        <motion.article className="coverage-card" variants={cardVariants}>
          <CoverageRing score={result.coverage.score} />
          <div className="coverage-copy">
            <p className="mono-label">{result.analysis_mode.toUpperCase()}</p>
            <h3>{result.coverage.label}</h3>
            <p>Lexical overlap across the supplied résumé content and role description.</p>
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

      <div id="findings" className="terms-grid">
        <motion.article className="terms-card matched-terms" variants={cardVariants}>
          <header><div><span className="result-icon success"><Check size={16} /></span><div><h3>Skills already covered</h3><p>Language detected in both inputs.</p></div></div><strong>{result.matched_terms.length}</strong></header>
          <TermList items={result.matched_terms} label="Matched terms" limit={MATCHED_LIMIT} reduceMotion={reduceMotion} />
          {!result.matched_terms.length && <p className="empty-copy">No matched terms were found in this scan.</p>}
        </motion.article>
        <motion.article className="terms-card missing-terms" variants={cardVariants}>
          <header><div><span className="result-icon warning"><Sparkles size={16} /></span><div><h3>Coverage opportunities</h3><p>Consider these terms where they accurately reflect experience.</p></div></div><strong>{result.missing_terms.length}</strong></header>
          <TermList items={result.missing_terms} label="Coverage opportunities" limit={OPPORTUNITY_LIMIT} reduceMotion={reduceMotion} />
          {!result.missing_terms.length && <p className="empty-copy">No missing terms—this lexical comparison is complete.</p>}
        </motion.article>
      </div>

      {categorized.length > 0 && (
        <motion.article className="insight-card" variants={cardVariants}>
          <header><div><span className="result-icon"><Layers3 size={16} /></span><div><h3>Category coverage</h3><p>Coverage across the curated relevance taxonomy.</p></div></div></header>
          <div className="category-bars">
            {categorized.map((category) => (
              <div className="category-row" key={category.category}>
                <div><span>{category.category}</span><strong>{category.display_value}</strong></div>
                <div className="category-track" role="meter" aria-label={`${category.category}: ${category.display_value}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={category.score ?? undefined}>
                  <span style={{ width: `${category.score ?? 0}%` }} />
                </div>
              </div>
            ))}
          </div>
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

      <ReviewWorkspace
        key={`${analysisKey}:${stale ? "stale" : "current"}`}
        opportunities={result.missing_terms}
        stale={stale}
      />

      <motion.article className="export-card" variants={cardVariants}>
        <div className="report-thumbnail" aria-hidden="true"><span>RKS</span><div /><div /><div /></div>
        <div className="export-copy"><p className="mono-label">CURRENT INPUT SIGNATURE</p><h3>Export your analysis</h3><p>Download a recruiter-ready PDF generated by the existing Unicode-safe Python report engine.</p><span><LockKeyhole size={14} /> Generated privately for the current scan</span></div>
        <button className="button button-primary" type="button" disabled={stale || reporting} onClick={onDownload}>
          <ArrowDownToLine size={17} /> {reporting ? "Preparing PDF…" : "Download PDF report"}
        </button>
      </motion.article>

      <div className="results-next-actions">
        <a className="button button-quiet" href="#workspace">Edit current inputs</a>
        {!confirmingNew ? (
          <button className="button button-quiet" type="button" onClick={() => setConfirmingNew(true)}><RotateCcw size={16} /> New analysis</button>
        ) : (
          <div className="new-analysis-confirmation" role="alertdialog" aria-labelledby="new-analysis-title">
            <strong id="new-analysis-title">Clear current inputs, results, and review decisions?</strong>
            <button type="button" onClick={onNewAnalysis}>Clear and start new</button>
            <button type="button" onClick={() => setConfirmingNew(false)}>Keep current analysis</button>
          </div>
        )}
      </div>

      <p className="results-disclaimer">Lexical keyword comparison—not a candidate-performance assessment or hiring recommendation.</p>
    </motion.section>
  );
}
