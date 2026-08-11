"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, ChevronDown, Clipboard, ClipboardCheck, Download, RotateCcw, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { AnalysisResponse } from "@/lib/contracts";
import {
  actionChecklist,
  filteredOpportunities,
  reviewItemId,
  reviewLabels,
  reviewStatuses,
  reviewSummary,
  type ReviewDecisions,
  type ReviewFilter,
  type ReviewStatus,
} from "./review-state";

interface ReviewWorkspaceProps {
  opportunities: AnalysisResponse["missing_terms"];
  stale: boolean;
  reducedMotion?: boolean;
}

const filters: Array<{ value: ReviewFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unreviewed", label: "Unreviewed" },
  ...reviewStatuses.map((status) => ({ value: status, label: reviewLabels[status] })),
];

const REVIEW_LIMIT = 10;

export function ReviewWorkspace({ opportunities, stale, reducedMotion }: ReviewWorkspaceProps) {
  const systemReducedMotion = useReducedMotion();
  const reduceMotion = reducedMotion ?? systemReducedMotion;
  const [decisions, setDecisions] = useState<ReviewDecisions>({});
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const resetTriggerRef = useRef<HTMLButtonElement>(null);
  const resetConfirmRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const summary = reviewSummary(opportunities.length, decisions);
  const filtered = useMemo(
    () => filteredOpportunities(opportunities, decisions, filter, query),
    [opportunities, decisions, filter, query],
  );
  const visible = expanded ? filtered : filtered.slice(0, REVIEW_LIMIT);
  const hiddenCount = Math.max(0, filtered.length - REVIEW_LIMIT);
  const addItems = opportunities.filter((_, index) => decisions[reviewItemId(index)] === "add");

  useEffect(() => {
    if (confirmingReset) resetConfirmRef.current?.focus();
  }, [confirmingReset]);

  function cancelReset() {
    setConfirmingReset(false);
    requestAnimationFrame(() => resetTriggerRef.current?.focus());
  }

  function setStatus(id: string, status: string) {
    setDecisions((current) => {
      if (!status) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: status as ReviewStatus };
    });
  }

  function selectFilter(next: ReviewFilter) {
    setFilter(next);
    setExpanded(false);
  }

  function downloadChecklist() {
    if (stale || !addItems.length) return;
    const blob = new Blob([actionChecklist(opportunities, decisions)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resume-action-checklist.md";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function copySelectedTerms() {
    if (!addItems.length) return;
    try {
      await navigator.clipboard.writeText(addItems.map((item) => item.term).join("\n"));
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  if (!opportunities.length) return null;

  return (
    <motion.section
      className="review-workspace"
      aria-labelledby="review-title"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.42 }}
    >
      <header className="review-header">
        <div>
          <p className="eyebrow"><span /> Decision workspace</p>
          <h3 id="review-title">Turn opportunities into an editing plan</h3>
          <p>Classify each term based on your actual experience. Decisions stay in this page only.</p>
        </div>
        <div className="review-progress" role="status" aria-live="polite">
          <strong>{summary.reviewed} of {summary.total}</strong>
          <span>reviewed · {summary.remaining} remaining</span>
          <div role="progressbar" aria-label="Review progress" aria-valuemin={0} aria-valuemax={summary.total} aria-valuenow={summary.reviewed}>
            <span style={{ width: `${summary.total ? (summary.reviewed / summary.total) * 100 : 0}%` }} />
          </div>
        </div>
      </header>

      {stale && (
        <p className="review-stale" role="status">
          Review decisions were cleared because the analysis inputs changed. Reanalyze to continue.
        </p>
      )}

      <dl className="review-totals" aria-label="Review status totals">
        <div><dt>Total</dt><dd>{summary.total}</dd></div>
        <div><dt>Add to résumé</dt><dd>{summary.add}</dd></div>
        <div><dt>Already represented</dt><dd>{summary.represented}</dd></div>
        <div><dt>Not relevant</dt><dd>{summary.not_relevant}</dd></div>
        <div><dt>Review later</dt><dd>{summary.later}</dd></div>
      </dl>

      <div className="review-tools">
        <fieldset className="review-filters">
          <legend>Filter opportunities</legend>
          {filters.map((item) => (
            <label key={item.value}>
              <input type="radio" name="review-filter" checked={filter === item.value} onChange={() => selectFilter(item.value)} />
              <span>{item.label}</span>
            </label>
          ))}
        </fieldset>
        <label className="review-search">
          <span className="sr-only">Search opportunities</span>
          <Search size={16} aria-hidden="true" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setExpanded(false); }} placeholder="Search terms" />
        </label>
      </div>

      <p className="review-visible-count" role="status">Showing {filtered.length} of {opportunities.length} opportunities</p>

      <div id={listId} className="review-list" aria-label="Opportunity review list">
        <AnimatePresence initial={false}>
          {visible.map(({ opportunity, id, index }) => (
            <motion.article
              className={`review-row status-${decisions[id] ?? "unreviewed"}`}
              key={`${id}-${opportunity.term}`}
              initial={reduceMotion ? false : { opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -3 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            >
              <span className="review-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="review-term"><strong>{opportunity.term}</strong><span>{opportunity.category ?? "Uncategorized"}</span></div>
              <label>
                <span className="sr-only">Review status for {opportunity.term}</span>
                <select value={decisions[id] ?? ""} onChange={(event) => setStatus(id, event.target.value)} disabled={stale}>
                  <option value="">Unreviewed</option>
                  {reviewStatuses.map((status) => <option value={status} key={status}>{reviewLabels[status]}</option>)}
                </select>
              </label>
            </motion.article>
          ))}
        </AnimatePresence>
        {!visible.length && <div className="review-empty"><ClipboardCheck size={20} /><strong>No opportunities match this view.</strong><span>Change the filter or search term to continue.</span></div>}
      </div>

      {hiddenCount > 0 && (
        <button className="term-toggle review-more" type="button" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Show fewer" : `Show ${hiddenCount} more`}<ChevronDown size={15} aria-hidden="true" />
        </button>
      )}

      <div className="review-actions">
        <div>
          {!confirmingReset ? (
            <button ref={resetTriggerRef} className="button button-quiet" type="button" disabled={!summary.reviewed} onClick={() => setConfirmingReset(true)}><RotateCcw size={15} /> Reset decisions</button>
          ) : (
            <div className="reset-confirmation" role="alertdialog" aria-labelledby="reset-title">
              <strong id="reset-title">Reset all review decisions?</strong>
              <button ref={resetConfirmRef} type="button" onClick={() => { setDecisions({}); setConfirmingReset(false); }}>Reset</button>
              <button type="button" onClick={cancelReset}>Cancel</button>
            </div>
          )}
        </div>
        <div className="checklist-action">
          <span><CheckCircle2 size={15} /> {addItems.length} item{addItems.length === 1 ? "" : "s"} ready for the checklist</span>
          <button className="button button-quiet" type="button" disabled={!addItems.length} onClick={copySelectedTerms}><Clipboard size={16} /> Copy selected terms</button>
          <button className="button button-primary" type="button" disabled={stale || !addItems.length} onClick={downloadChecklist}><Download size={16} /> Download Markdown checklist</button>
        </div>
      </div>

      <p className="copy-status" role="status" aria-live="polite">{copyState === "copied" ? "Selected terms copied." : copyState === "error" ? "Clipboard access failed. Select the terms in the action summary instead." : ""}</p>

      {summary.total > 0 && summary.remaining === 0 && (
        <div className="review-complete" role="status"><CheckCircle2 size={18} /><strong>All {summary.total} opportunities reviewed.</strong><span>Export your decisions, rerun the comparison, or start a new analysis.</span></div>
      )}

      {addItems.length > 0 && (
        <div className="action-checklist" aria-labelledby="checklist-title">
          <p className="mono-label">LOCAL ACTION SUMMARY</p>
          <h4 id="checklist-title">Add to résumé</h4>
          <ul>{addItems.map((item, index) => <li key={`${item.term}-${index}`}>{item.term}</li>)}</ul>
          <p>Future PDF integration should submit these term identifiers for server validation; browser review state is not authoritative.</p>
        </div>
      )}
      <a className="back-link review-back" href="#summary">↑ Back to summary</a>
    </motion.section>
  );
}
