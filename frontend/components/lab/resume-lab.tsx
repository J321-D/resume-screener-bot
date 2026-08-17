"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Beaker, ChevronDown, CircleDot, Eraser, FileDiff, FlaskConical, GitCompareArrows, LockKeyhole, Orbit, Play, Printer, RotateCcw, Timeline } from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import { fingerprintCode } from "@/components/results/analysis-fingerprint";
import {
  compareAnalysisRuns,
  MAX_LAB_RUNS,
  MAX_RESUME_VARIANTS,
  unresolvedReviewCount,
  type AnalysisRun,
  type ComparisonFinding,
} from "./comparison-model";

interface ResumeLabProps {
  runs: AnalysisRun[];
  activeRunId: string | null;
  notice: string | null;
  demoAvailable: boolean;
  onSelectRun: (runId: string, findingId?: string) => void;
  onClear: () => void;
  onLoadDemoVariant: () => void;
  revisionSeed: string;
  revisionRunning: boolean;
  preferredBaselineId: string | null;
  onRunRevision: (revisionText: string, baselineId: string) => Promise<boolean>;
}

const statusLabels: Record<ComparisonFinding["status"], string> = {
  unchanged_represented: "Unchanged represented",
  unchanged_review_item: "Unchanged review item",
  newly_represented: "Newly represented",
  no_longer_represented: "No longer represented",
  new_finding: "New finding",
  removed_finding: "Removed finding",
};

function scoreLabel(score: number | null) {
  return score === null ? "N/A" : `${score.toFixed(1)}%`;
}

export function ResumeLab({ runs, activeRunId, notice, demoAvailable, onSelectRun, onClear, onLoadDemoVariant, revisionSeed, revisionRunning, preferredBaselineId, onRunRevision }: ResumeLabProps) {
  const reduceMotion = useReducedMotion();
  const [baselineId, setBaselineId] = useState(runs[0]?.runId ?? "");
  const [currentId, setCurrentId] = useState(runs.at(-1)?.runId ?? "");
  const [emphasis, setEmphasis] = useState(50);
  const [comparisonNote, setComparisonNote] = useState("");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [revisionText, setRevisionText] = useState(revisionSeed);
  const [revisionStatus, setRevisionStatus] = useState<string | null>(null);
  const clearConfirmRef = useRef<HTMLButtonElement>(null);
  const newestRunId = runs.at(-1)?.runId ?? "";

  useEffect(() => {
    if (!runs.some((run) => run.runId === baselineId)) setBaselineId(runs[0]?.runId ?? "");
    if (!runs.some((run) => run.runId === currentId)) setCurrentId(runs.at(-1)?.runId ?? "");
  }, [baselineId, currentId, runs]);

  useEffect(() => {
    if (runs.length > 1) setCurrentId(newestRunId);
  }, [newestRunId, runs.length]);

  useEffect(() => setComparisonNote(""), [baselineId, currentId]);
  useEffect(() => { if (confirmingClear) clearConfirmRef.current?.focus(); }, [confirmingClear]);
  useEffect(() => {
    if (preferredBaselineId && runs.some((run) => run.runId === preferredBaselineId)) setBaselineId(preferredBaselineId);
  }, [preferredBaselineId, runs]);

  const baseline = runs.find((run) => run.runId === baselineId) ?? runs[0];
  const current = runs.find((run) => run.runId === currentId) ?? runs.at(-1);
  const comparison = useMemo(() => baseline && current && baseline.runId !== current.runId ? compareAnalysisRuns(baseline, current) : null, [baseline, current]);
  const changedFindings = comparison?.findings.filter((finding) => !finding.status.startsWith("unchanged")) ?? [];
  const unchangedFindings = comparison?.findings.filter((finding) => finding.status.startsWith("unchanged")) ?? [];

  function inspectDifference(finding: ComparisonFinding) {
    const run = finding.current ? current : baseline;
    const id = finding.current?.finding_id ?? finding.baseline?.finding_id;
    if (run && id) onSelectRun(run.runId, id);
  }

  async function submitRevision() {
    if (!revisionText.trim() || !baseline) return;
    setRevisionStatus("Submitting this temporary copy through the existing analysis request…");
    const accepted = await onRunRevision(revisionText, baseline.runId);
    setRevisionStatus(accepted
      ? "Revision run completed. Diff Reactor now compares it with the selected baseline."
      : "Revision run was not retained. Review the analysis error or Resume Lab capacity message.");
  }

  function resetRevision() {
    setRevisionText(revisionSeed);
    setRevisionStatus("Temporary revision copy reset to the current in-memory résumé text.");
  }

  function printComparison() {
    document.documentElement.dataset.printView = "comparison";
    const restore = () => { delete document.documentElement.dataset.printView; };
    window.addEventListener("afterprint", restore, { once: true });
    window.print();
  }

  if (!runs.length) return null;

  return (
    <motion.section id="resume-lab" className="resume-lab shell" aria-labelledby="resume-lab-title" initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <header className="lab-header">
        <div><p className="eyebrow"><span /> Session-only comparison</p><h2 id="resume-lab-title">Resume Lab</h2><p>Compare bounded deterministic runs against one role. Nothing here is saved after reset, refresh, or tab close.</p></div>
        <div className="lab-capacity"><span>{runs.length} / {MAX_LAB_RUNS} runs</span><span>{new Set(runs.map((run) => run.resumeIdentity)).size} / {MAX_RESUME_VARIANTS} variants</span></div>
      </header>
      {notice && <p className="lab-notice" role="status">{notice}</p>}

      <section className="resume-hangar" aria-labelledby="hangar-title">
        <header><div><span className="mono-label">ONE ROLE // BOUNDED VARIANTS</span><h3 id="hangar-title">Résumé hangar</h3></div><p>Node size does not indicate quality. Fingerprints encode returned counts only.</p></header>
        <div className="hangar-stage">
          <div className="hangar-job"><Orbit aria-hidden="true" /><strong>JOB DESCRIPTION</strong><small>shared session anchor</small></div>
          <div className="hangar-runs">
            {runs.map((run, index) => {
              const fingerprint = fingerprintCode(run.analysis.categories, run.analysis.coverage);
              return (
                <button type="button" key={run.runId} aria-pressed={activeRunId === run.runId} onClick={() => onSelectRun(run.runId)}>
                  <span>{String(index + 1).padStart(2, "0")}</span><strong>{run.label}</strong><code>{fingerprint}</code><small>{run.sourceType.replaceAll("_", " ")} · {scoreLabel(run.analysis.coverage.score)} lexical coverage</small>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="run-timeline" className="run-timeline" aria-labelledby="timeline-title">
        <header><div><Timeline size={17} /><h3 id="timeline-title">Ephemeral run timeline</h3></div><p>Session-only. Cleared when this page is reset or refreshed.</p></header>
        <ol>{runs.map((run, index) => <li key={run.runId} data-active={activeRunId === run.runId}><button type="button" onClick={() => onSelectRun(run.runId)}><span>RUN {String(index + 1).padStart(2, "0")}</span><strong>{run.label}</strong><small>{run.sourceType.replaceAll("_", " ")} · {new Date(run.createdAtClient).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></button></li>)}</ol>
      </section>

      <section id="lab-matrix" className="lab-matrix" aria-labelledby="lab-matrix-title">
        <header><div><GitCompareArrows size={18} /><h3 id="lab-matrix-title">Authoritative run matrix</h3></div><p>Existing scores and counts only; no hiring probability or severity.</p></header>
        <div className="lab-table-wrap"><table><caption className="sr-only">Comparison of retained Resume Lab runs</caption><thead><tr><th scope="col">Run</th><th scope="col">Coverage</th><th scope="col">Represented</th><th scope="col">Opportunities</th><th scope="col">Evidence</th><th scope="col">Review remaining</th></tr></thead><tbody>{runs.map((run) => <tr key={run.runId} data-active={activeRunId === run.runId}><th scope="row"><button type="button" onClick={() => onSelectRun(run.runId)}>{run.label}</button></th><td>{scoreLabel(run.analysis.coverage.score)}</td><td>{run.analysis.coverage.matched}</td><td>{run.analysis.coverage.missing}</td><td>{run.analysis.evidenceContract.findings.reduce((total, finding) => total + finding.evidence.length, 0)}</td><td>{unresolvedReviewCount(run)}</td></tr>)}</tbody></table></div>
      </section>

      {runs.length > 1 && (
        <section id="diff-reactor" className="diff-reactor" aria-labelledby="diff-title">
          <header><div><FileDiff size={19} /><div><span className="mono-label">BEFORE / AFTER // DETERMINISTIC DELTA</span><h3 id="diff-title">Diff Reactor</h3></div></div><p>Changes describe returned lexical representation only.</p></header>
          <div className="diff-selectors">
            <label><span>Baseline</span><select value={baseline?.runId} onChange={(event) => setBaselineId(event.target.value)}>{runs.map((run) => <option key={run.runId} value={run.runId}>{run.label}</option>)}</select></label>
            <ArrowRight aria-hidden="true" />
            <label><span>Current</span><select value={current?.runId} onChange={(event) => setCurrentId(event.target.value)}>{runs.map((run) => <option key={run.runId} value={run.runId}>{run.label}</option>)}</select></label>
          </div>
          {!comparison ? <p className="lab-empty">Choose two different runs to compare.</p> : !comparison.comparable ? <p className="lab-warning" role="status">Comparison unavailable — {comparison.unavailableReason}</p> : (
            <>
              <div className="diff-reactor-stage" style={{ "--diff-emphasis": `${emphasis}%` } as CSSProperties}>
                <div data-side="baseline"><span>BASELINE</span><strong>{scoreLabel(comparison.baseline.analysis.coverage.score)}</strong><code>{fingerprintCode(comparison.baseline.analysis.categories, comparison.baseline.analysis.coverage)}</code></div>
                <div className="diff-core" aria-hidden="true"><CircleDot /><span /></div>
                <div data-side="current"><span>CURRENT</span><strong>{scoreLabel(comparison.current.analysis.coverage.score)}</strong><code>{fingerprintCode(comparison.current.analysis.categories, comparison.current.analysis.coverage)}</code></div>
              </div>
              <label className="diff-emphasis"><span>Visual baseline/current emphasis</span><input type="range" min="0" max="100" value={emphasis} onChange={(event) => setEmphasis(Number(event.target.value))} /><small>Presentation only; values and differences do not change.</small></label>
              <dl className="diff-summary"><div><dt>Coverage change</dt><dd>{comparison.coverageDelta === null ? "N/A" : `${comparison.coverageDelta > 0 ? "+" : ""}${comparison.coverageDelta.toFixed(1)} points`}</dd></div><div><dt>Newly represented</dt><dd>{comparison.findings.filter((item) => item.status === "newly_represented").length}</dd></div><div><dt>No longer represented</dt><dd>{comparison.findings.filter((item) => item.status === "no_longer_represented").length}</dd></div><div><dt>Evidence change</dt><dd>{comparison.evidenceDelta > 0 ? "+" : ""}{comparison.evidenceDelta}</dd></div></dl>
              <div className="comparison-grid">
                <section><h4>Changed findings</h4>{changedFindings.length ? <ul>{changedFindings.map((finding) => <li key={finding.comparisonKey}><button type="button" onClick={() => inspectDifference(finding)}><strong>{finding.displayTerm}</strong><span>{statusLabels[finding.status]}</span><small>{finding.category ?? "Uncategorized"}</small></button></li>)}</ul> : <p>No finding-status changes between these runs.</p>}</section>
                <section><h4>Unchanged findings</h4>{unchangedFindings.length ? <ul>{unchangedFindings.map((finding) => <li key={finding.comparisonKey}><button type="button" onClick={() => inspectDifference(finding)}><strong>{finding.displayTerm}</strong><span>{statusLabels[finding.status]}</span><small>{finding.category ?? "Uncategorized"}</small></button></li>)}</ul> : <p>No unchanged comparable findings.</p>}</section>
              </div>
              <details className="comparison-record"><summary><span><Beaker size={16} /> Living Report comparison record</span><ChevronDown size={16} /></summary><div><p><strong>{comparison.baseline.label}</strong> → <strong>{comparison.current.label}</strong></p><ul>{comparison.categories.map((category) => <li key={category.category}><span>{category.category}</span><strong>{category.baselineMatched}/{category.baselineTotal} → {category.currentMatched}/{category.currentTotal}</strong><small>{category.matchedDelta > 0 ? "+" : ""}{category.matchedDelta} represented</small></li>)}</ul><p>Screen-only comparison assembled from current in-memory runs. It makes no causality or hiring-probability claim.</p><button className="button button-quiet comparison-print" type="button" onClick={printComparison}><Printer size={15} /> Print comparison report</button></div></details>
            </>
          )}
        </section>
      )}

      <section id="revision-workspace" className="lab-workbench revision-workspace" aria-labelledby="workbench-title">
        <header><div><RotateCcw size={18} /><div><span className="mono-label">LOCAL COPY // EXPLICIT SUBMISSION</span><h3 id="workbench-title">Temporary revision workspace</h3></div></div><strong>Session-only · unsaved</strong></header>
        <p><strong>Temporary revision copy.</strong> Edits here do not modify your uploaded résumé file. Nothing autosaves; Run Revision sends only this copy through the existing analysis request.</p>
        {!revisionSeed.trim() && <p className="lab-warning" role="status">This run came from uploaded content that is not echoed back to the browser. Paste a revision copy below; the original PDF or DOCX remains untouched.</p>}
        <div className="revision-controls">
          <label><span>Compare against</span><select value={baselineId} onChange={(event) => setBaselineId(event.target.value)}>{runs.map((run) => <option key={run.runId} value={run.runId}>{run.label}</option>)}</select></label>
          <span>Source type: temporary text revision</span>
        </div>
        <label className="revision-editor"><span>Temporary résumé revision</span><textarea aria-label="Temporary résumé revision" value={revisionText} onChange={(event) => { setRevisionText(event.target.value); setRevisionStatus(null); }} maxLength={200000} rows={12} placeholder="Paste or edit a temporary résumé text copy…" /><small>{revisionText.length.toLocaleString()} / 200,000 characters · browser memory only</small></label>
        <div className="revision-actions"><button className="button button-quiet" type="button" onClick={resetRevision} disabled={revisionRunning}><RotateCcw size={15} /> Reset temporary copy</button><button className="scan-button" type="button" onClick={submitRevision} disabled={!revisionText.trim() || revisionRunning}><Play size={15} /> {revisionRunning ? "Running revision…" : "Run Revision"}</button></div>
        {revisionStatus && <p className="lab-notice" role="status">{revisionStatus}</p>}
      </section>
      <label className="comparison-note"><span>Comparison-only scratchpad</span><textarea value={comparisonNote} onChange={(event) => setComparisonNote(event.target.value)} maxLength={500} rows={3} placeholder="Record session-only comparison context…" /><small>{comparisonNote.length} / 500 · never saved or copied to another run</small></label>

      <div className="lab-actions">
        <div>{demoAvailable && <button className="button button-quiet" type="button" onClick={onLoadDemoVariant}><FlaskConical size={16} /> Load next fictional variant</button>}<a id="add-resume-variant" className="button button-quiet" href="#workspace">Add résumé variant</a></div>
        {!confirmingClear ? <button id="clear-resume-lab" className="button button-quiet" type="button" onClick={() => setConfirmingClear(true)}><Eraser size={16} /> Clear Resume Lab session</button> : <div className="lab-clear-confirmation" role="alertdialog" aria-labelledby="lab-clear-title"><strong id="lab-clear-title">Clear all retained runs, review decisions, and notes?</strong><button ref={clearConfirmRef} type="button" onClick={onClear}>Clear in-app session state</button><button type="button" onClick={() => setConfirmingClear(false)}>Cancel</button></div>}
      </div>
      <p className="lab-privacy"><LockKeyhole size={14} /> Clearing releases application references to this Lab session; it is not a secure browser-memory erasure guarantee.</p>
    </motion.section>
  );
}
