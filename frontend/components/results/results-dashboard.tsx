"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowDownToLine, Check, ChevronDown, Clock3, FileText, Layers3, LockKeyhole, Sparkles } from "lucide-react";
import { useId, useState } from "react";

import type { AnalysisResponse } from "@/lib/contracts";
import { ReviewWorkspace } from "@/components/review/review-workspace";
import { CoverageRing } from "./coverage-ring";

interface ResultsDashboardProps {
  result: AnalysisResponse;
  stale: boolean;
  reporting: boolean;
  analysisKey: string;
  onDownload: () => void;
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

export function ResultsDashboard({ result, stale, reporting, analysisKey, onDownload }: ResultsDashboardProps) {
  const reduceMotion = useReducedMotion();
  const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.metadata.analyzed_at));
  const categorized = result.categories.filter((category) => category.category !== "Uncategorized");
  const isFocused = result.analysis_mode === "Skills-focused analysis";

  return (
    <motion.section
      className="results shell"
      aria-labelledby="results-title"
      initial={reduceMotion ? false : "hidden"}
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } } }}
    >
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

      <div className="result-hero-grid">
        <motion.article className="coverage-card" variants={cardVariants}>
          <CoverageRing score={result.coverage.score} />
          <div className="coverage-copy">
            <p className="mono-label">{result.analysis_mode.toUpperCase()}</p>
            <h3>{result.coverage.label}</h3>
            <p>Lexical overlap across the supplied résumé content and role description.</p>
            <div className="result-meta"><FileText size={15} /><span>{result.metadata.resume_label}</span></div>
            <div className="result-meta"><Clock3 size={15} /><time dateTime={result.metadata.analyzed_at}>{date}</time></div>
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

      <div className="terms-grid">
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

      <p className="results-disclaimer">Lexical keyword comparison—not a candidate-performance assessment or hiring recommendation.</p>
    </motion.section>
  );
}
