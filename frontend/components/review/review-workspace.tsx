"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Clipboard, ClipboardCheck, Crosshair, Download, GitBranch, NotebookPen, RotateCcw, Search, Target } from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import {
  actionChecklist,
  filteredOpportunities,
  reviewItemId,
  reviewLabels,
  reviewStatuses,
  reviewSummary,
  unresolvedOpportunities,
  type ReviewDecisions,
  type ReviewFilter,
  type ReviewNotes,
  type ReviewOpportunity,
  type ReviewStatus,
} from "./review-state";

interface ReviewWorkspaceProps {
  opportunities: ReviewOpportunity[];
  stale: boolean;
  reducedMotion?: boolean;
  focusCategory?: string | null;
  focusTerm?: string | null;
  onInspectFinding?: (findingId: string) => void;
  onDecisionsChange?: (decisions: ReviewDecisions) => void;
  onNotesChange?: (notes: ReviewNotes) => void;
  initialDecisions?: ReviewDecisions;
  initialNotes?: ReviewNotes;
}

const filters: Array<{ value: ReviewFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "unreviewed", label: "Unreviewed" },
  ...reviewStatuses.map((status) => ({ value: status, label: reviewLabels[status] })),
];

const REVIEW_LIMIT = 10;

export function ReviewWorkspace({ opportunities, stale, reducedMotion, focusCategory, focusTerm, onInspectFinding, onDecisionsChange, onNotesChange, initialDecisions = {}, initialNotes = {} }: ReviewWorkspaceProps) {
  const systemReducedMotion = useReducedMotion();
  const reduceMotion = reducedMotion ?? systemReducedMotion;
  const [decisions, setDecisions] = useState<ReviewDecisions>(initialDecisions);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [gapMode, setGapMode] = useState(false);
  const [gapIndex, setGapIndex] = useState(0);
  const [notes, setNotes] = useState<ReviewNotes>(initialNotes);
  const resetTriggerRef = useRef<HTMLButtonElement>(null);
  const resetConfirmRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const summary = reviewSummary(opportunities.length, decisions);
  const filtered = useMemo(() => filteredOpportunities(opportunities, decisions, filter, query).filter(({ opportunity }) => {
    if (focusTerm && opportunity.term !== focusTerm) return false;
    if (focusCategory && (opportunity.category ?? "Uncategorized") !== focusCategory) return false;
    return true;
  }), [opportunities, decisions, filter, query, focusCategory, focusTerm]);
  const visible = expanded ? filtered : filtered.slice(0, REVIEW_LIMIT);
  const hiddenCount = Math.max(0, filtered.length - REVIEW_LIMIT);
  const addItems = opportunities.filter((item, index) => decisions[reviewItemId(index, item.findingId)] === "add");
  const unresolved = unresolvedOpportunities(opportunities, decisions);
  const resolvedCount = summary.add + summary.represented + summary.not_relevant;
  const activeGap = unresolved[gapIndex] ?? null;

  useEffect(() => {
    if (confirmingReset) resetConfirmRef.current?.focus();
  }, [confirmingReset]);

  useEffect(() => setExpanded(false), [focusCategory, focusTerm]);

  useEffect(() => onDecisionsChange?.(decisions), [decisions, onDecisionsChange]);
  useEffect(() => onNotesChange?.(notes), [notes, onNotesChange]);

  useEffect(() => {
    if (!unresolved.length) {
      setGapMode(false);
      setGapIndex(0);
    } else if (gapIndex >= unresolved.length) {
      setGapIndex(unresolved.length - 1);
    }
  }, [gapIndex, unresolved.length]);

  function cancelReset() {
    setConfirmingReset(false);
    requestAnimationFrame(() => resetTriggerRef.current?.focus());
  }

  function setStatus(id: string, status: string) {
    if (gapMode && activeGap?.id === id && status && status !== "later") {
      setGapIndex((current) => Math.max(0, Math.min(current, unresolved.length - 2)));
    }
    setDecisions((current) => {
      if (!status) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: status as ReviewStatus };
    });
  }

  function updateNote(id: string, note: string) {
    setNotes((current) => {
      if (!note) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: note };
    });
  }

  function selectFilter(next: ReviewFilter) {
    setFilter(next);
    setExpanded(false);
  }

  function handleRowKeys(event: ReactKeyboardEvent<HTMLElement>, id: string) {
    if (event.target instanceof HTMLSelectElement) return;
    const rows = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLElement>(".review-row") ?? []);
    const current = rows.indexOf(event.currentTarget);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const offset = event.key === "ArrowDown" ? 1 : -1;
      rows[(current + offset + rows.length) % rows.length]?.focus();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLSelectElement>("select")?.focus();
      return;
    }
    const shortcuts: Record<string, ReviewStatus> = { "1": "add", "2": "represented", "3": "not_relevant", "4": "later" };
    if (!stale && shortcuts[event.key]) {
      event.preventDefault();
      setStatus(id, shortcuts[event.key]);
    }
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
      tabIndex={-1}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.42 }}
    >
      <header className="review-header">
        <div>
          <p className="eyebrow"><span /> Decision workspace</p>
          <h3 id="review-title">Turn opportunities into an editing plan</h3>
          <p>Classify each term based on your actual experience. Decisions stay in this page only. <a className="context-link" href="/help#review-workspace">Review guide</a></p>
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
      {focusCategory && (
        <p className="review-focus" role="status">Focused on {focusTerm ? `“${focusTerm}” in ` : ""}{focusCategory}. Review totals and saved decisions still represent the full scan.</p>
      )}

      <dl className="review-totals" aria-label="Review status totals">
        <div><dt>Total</dt><dd>{summary.total}</dd></div>
        <div><dt>Add to résumé</dt><dd>{summary.add}</dd></div>
        <div><dt>Already represented</dt><dd>{summary.represented}</dd></div>
        <div><dt>Not relevant</dt><dd>{summary.not_relevant}</dd></div>
        <div><dt>Review later</dt><dd>{summary.later}</dd></div>
      </dl>

      <section className="mission-board" aria-labelledby="mission-title">
        <header>
          <div><span className="mono-label">APPLICATION MISSION BOARD</span><h4 id="mission-title">Review workflow</h4></div>
          <strong>{resolvedCount} / {summary.total} resolved</strong>
        </header>
        <ol>
          <li data-state={resolvedCount ? "active" : "pending"}><span>01</span><div><strong>Classify returned opportunities</strong><small>{unresolved.length} still need a final decision</small></div></li>
          <li data-state={Object.keys(notes).length ? "active" : "pending"}><span>02</span><div><strong>Record local context</strong><small>{Object.keys(notes).length} session note{Object.keys(notes).length === 1 ? "" : "s"}</small></div></li>
          <li data-state={addItems.length ? "active" : "pending"}><span>03</span><div><strong>Build a truthful revision checklist</strong><small>{addItems.length} selected for possible addition</small></div></li>
        </ol>
        <button id="gap-mode-trigger" className="button button-primary" type="button" disabled={stale || !unresolved.length} onClick={() => { setGapMode(true); setGapIndex(0); }}><Crosshair size={16} /> Review unresolved gaps</button>
        <p>Mission progress reflects your review activity only—not application readiness or hiring likelihood.</p>
      </section>

      <AnimatePresence initial={false}>
        {gapMode && activeGap && (
          <motion.section
            className="gap-mode"
            role="dialog"
            aria-modal="false"
            aria-labelledby="gap-mode-title"
            initial={reduceMotion ? false : { opacity: 0, scale: .985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, scale: .99 }}
          >
            <header>
              <div><span>GAP MODE · {String(gapIndex + 1).padStart(2, "0")} / {String(unresolved.length).padStart(2, "0")}</span><h4 id="gap-mode-title">{activeGap.opportunity.term}</h4><p>{activeGap.opportunity.category ?? "Uncategorized"} · returned lexical opportunity</p></div>
              <button type="button" onClick={() => setGapMode(false)}>Exit Gap Mode</button>
            </header>
            <div className="gap-mode-grid">
              <div className="gap-decision">
                <Target size={20} aria-hidden="true" />
                <strong>Choose based on your real experience.</strong>
                <p>This decision changes only the local review workflow. It does not change coverage or the deterministic analysis result.</p>
                <label><span>Review decision</span><select aria-label={`Gap decision for ${activeGap.opportunity.term}`} value={decisions[activeGap.id] ?? ""} onChange={(event) => setStatus(activeGap.id, event.target.value)}><option value="">Unreviewed</option>{reviewStatuses.map((status) => <option value={status} key={status}>{reviewLabels[status]}</option>)}</select></label>
                {activeGap.opportunity.findingId && <button className="evidence-action" type="button" onClick={() => onInspectFinding?.(activeGap.opportunity.findingId!)}><GitBranch size={14} /> Trace finding</button>}
              </div>
              <label className="gap-note"><span><NotebookPen size={15} /> Session-only note</span><textarea aria-label={`Session note for ${activeGap.opportunity.term}`} value={notes[activeGap.id] ?? ""} onChange={(event) => updateNote(activeGap.id, event.target.value)} maxLength={500} rows={5} placeholder="Record context for your own review…" /><small>{(notes[activeGap.id] ?? "").length} / 500 · cleared with this page session</small></label>
            </div>
            <footer>
              <button type="button" disabled={gapIndex === 0} onClick={() => setGapIndex((current) => Math.max(0, current - 1))}><ArrowLeft size={15} /> Previous</button>
              <span>{unresolved.length} unresolved · engine order preserved</span>
              <button type="button" disabled={gapIndex >= unresolved.length - 1} onClick={() => setGapIndex((current) => Math.min(unresolved.length - 1, current + 1))}>Next <ArrowRight size={15} /></button>
            </footer>
          </motion.section>
        )}
      </AnimatePresence>

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

      <p className="review-shortcuts"><kbd>↑↓</kbd> move <kbd>Enter</kbd> inspect <kbd>1</kbd> add <kbd>2</kbd> represented <kbd>3</kbd> not relevant <kbd>4</kbd> later</p>

      <p className="review-visible-count" role="status">Showing {filtered.length} of {opportunities.length} opportunities</p>

      <div id={listId} className="review-list" aria-label="Opportunity review list">
        <AnimatePresence initial={false}>
          {visible.map(({ opportunity, id, index }) => (
            <motion.article
              className={`review-row status-${decisions[id] ?? "unreviewed"}`}
              tabIndex={0}
              aria-keyshortcuts="ArrowUp ArrowDown Enter 1 2 3 4"
              onKeyDown={(event) => handleRowKeys(event, id)}
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
              {opportunity.findingId && <button className="evidence-action" type="button" onClick={() => onInspectFinding?.(opportunity.findingId!)}><GitBranch size={14} /> Inspect evidence</button>}
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
              <button ref={resetConfirmRef} type="button" onClick={() => { setDecisions({}); setNotes({}); setGapMode(false); setConfirmingReset(false); }}>Reset</button>
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
