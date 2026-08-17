"use client";

import dynamic from "next/dynamic";
import { ArrowRight, FileSearch, FlaskConical, LockKeyhole, RotateCcw, ScanSearch } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { analyze, createReport, SLOW_REQUEST_NOTICE_MS } from "@/lib/api";
import { analysisModes, type AnalysisInputs, type AnalysisMode, type AnalysisViewModel, type PublicError } from "@/lib/contracts";
import { inputSignature, jobInputIdentity, MAX_TEXT_CHARACTERS, resumeInputIdentity, validateFiles } from "@/lib/formatting";
import { SYNTHETIC_DEMO_JOB, SYNTHETIC_DEMO_VARIANTS, syntheticDemoInputs } from "@/components/demo/synthetic-demo";
import { appendAnalysisRun, type AnalysisRun, type AnalysisRunSource } from "@/components/lab/comparison-model";
import type { ReviewDecisions, ReviewNotes } from "@/components/review/review-state";
import { FileDropZone } from "./file-drop-zone";
import { ProgressStatus, type ProgressStage } from "./progress-status";

const ResultsDashboard = dynamic(
  () => import("@/components/results/results-dashboard").then((module) => module.ResultsDashboard),
  { loading: () => <div className="results-skeleton" aria-label="Loading results presentation" /> },
);

const ResumeLab = dynamic(
  () => import("@/components/lab/resume-lab").then((module) => module.ResumeLab),
  { loading: () => <div className="results-skeleton" aria-label="Loading Resume Lab" /> },
);

const emptyInputs: AnalysisInputs = {
  analysisMode: analysisModes[0],
  resumeFiles: [],
  resumeText: "",
  jobFile: null,
  jobText: "",
};

type AnalysisState = "idle" | "input_ready" | "submitting" | "processing" | "results" | "stale_results" | "error" | "canceled";

export function Analyzer() {
  const [inputs, setInputs] = useState<AnalysisInputs>(emptyInputs);
  const [result, setResult] = useState<AnalysisViewModel | null>(null);
  const [resultSignature, setResultSignature] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressStage>("idle");
  const [error, setError] = useState<PublicError | null>(null);
  const [reportError, setReportError] = useState<PublicError | null>(null);
  const [reporting, setReporting] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [labRuns, setLabRuns] = useState<AnalysisRun[]>([]);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [labNotice, setLabNotice] = useState<string | null>(null);
  const [initialFindingId, setInitialFindingId] = useState<string | null>(null);
  const [preferredBaselineId, setPreferredBaselineId] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const reportRef = useRef<AbortController | null>(null);
  const runSequenceRef = useRef(0);

  const signature = useMemo(() => inputSignature(inputs), [inputs]);
  const stale = Boolean(result && resultSignature !== signature);
  const resumeError = validateFiles(inputs.resumeFiles);
  const jobError = inputs.jobFile ? validateFiles([inputs.jobFile], 1) : null;
  const ready = Boolean(
    (inputs.resumeFiles.length || inputs.resumeText.trim())
    && (inputs.jobFile || inputs.jobText.trim())
    && !resumeError
    && !jobError,
  );
  const analysisState: AnalysisState = stale
    ? "stale_results"
    : progress === "preparing"
    ? "submitting"
    : progress === "analyzing"
    ? "processing"
    : error?.code === "request_canceled"
    ? "canceled"
    : error
    ? "error"
    : result
    ? "results"
    : ready
    ? "input_ready"
    : "idle";

  useEffect(() => {
    document.documentElement.dataset.analysisState = analysisState;
    return () => {
      delete document.documentElement.dataset.analysisState;
    };
  }, [analysisState]);

  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get("demo");
    if (demo !== "1" && demo !== "cinematic") return;
    setInputs(syntheticDemoInputs());
    setDemoLoaded(true);
    if (demo === "cinematic") {
      document.documentElement.dataset.presentation = "active";
      window.dispatchEvent(new CustomEvent("presentation-mode-change", { detail: { active: true } }));
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("demo");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => () => {
    requestRef.current?.abort();
    reportRef.current?.abort();
  }, []);

  function update<T extends keyof AnalysisInputs>(key: T, value: AnalysisInputs[T]) {
    reportRef.current?.abort();
    reportRef.current = null;
    setInputs((current) => ({ ...current, [key]: value }));
    setError(null);
    setReportError(null);
    setReporting(false);
    if (result) setProgress("idle");
    setDemoLoaded(false);
  }

  function sourceTypeFor(candidate: AnalysisInputs): AnalysisRunSource {
    if (demoLoaded) return "fictional_demo";
    if (candidate.resumeFiles.length && candidate.resumeText.trim()) return "combined_sources";
    if (candidate.resumeFiles.length) return "uploaded_document";
    return "pasted_text";
  }

  function inputsAreReady(candidate: AnalysisInputs) {
    return Boolean(
      (candidate.resumeFiles.length || candidate.resumeText.trim())
      && (candidate.jobFile || candidate.jobText.trim())
      && !validateFiles(candidate.resumeFiles)
      && !(candidate.jobFile && validateFiles([candidate.jobFile], 1)),
    );
  }

  async function runAnalysis(
    candidate: AnalysisInputs = inputs,
    sourceType: AnalysisRunSource = sourceTypeFor(candidate),
    comparisonBaselineId: string | null = null,
  ): Promise<boolean> {
    if (!inputsAreReady(candidate) || progress === "analyzing") return false;
    requestRef.current?.abort();
    const controller = new AbortController();
    const submittedInputs: AnalysisInputs = {
      ...candidate,
      resumeFiles: [...candidate.resumeFiles],
    };
    const submittedSignature = inputSignature(submittedInputs);
    requestRef.current = controller;
    setError(null);
    setReportError(null);
    setSlowRequest(false);
    setProgress("preparing");
    await Promise.resolve();
    setProgress("analyzing");
    const slowTimer = window.setTimeout(() => setSlowRequest(true), SLOW_REQUEST_NOTICE_MS);
    try {
      const response = await analyze(submittedInputs, controller.signal);
      if (requestRef.current !== controller) return false;
      runSequenceRef.current += 1;
      const run: AnalysisRun = {
        runId: `lab-run-${runSequenceRef.current}`,
        label: `Run ${String(runSequenceRef.current).padStart(2, "0")} · ${response.metadata.resume_label}`,
        createdAtClient: new Date().toISOString(),
        analysis: response,
        inputIdentity: submittedSignature,
        resumeIdentity: resumeInputIdentity(submittedInputs),
        jobIdentity: jobInputIdentity(submittedInputs),
        reviewState: {},
        notes: {},
        sourceType,
      };
      const appended = appendAnalysisRun(labRuns, run);
      setLabRuns(appended.runs);
      setLabNotice(appended.message);
      setActiveRunId(appended.accepted ? run.runId : null);
      setInitialFindingId(null);
      setPreferredBaselineId(appended.accepted ? comparisonBaselineId : null);
      setInputs(submittedInputs);
      setResult(response);
      setResultSignature(submittedSignature);
      setProgress("complete");
      if (sourceType === "temporary_text_revision") setDemoLoaded(false);
      return appended.accepted;
    } catch (caught) {
      if (controller.signal.aborted) return false;
      setError(caught as PublicError);
      setProgress("idle");
      return false;
    } finally {
      window.clearTimeout(slowTimer);
      if (requestRef.current === controller) setSlowRequest(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  async function downloadReport() {
    if (stale || !result) return;
    reportRef.current?.abort();
    const controller = new AbortController();
    reportRef.current = controller;
    setReporting(true);
    setReportError(null);
    try {
      const blob = await createReport(inputs, controller.signal);
      if (reportRef.current !== controller) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "resume-keyword-report.pdf";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setReportError(caught as PublicError);
    } finally {
      if (reportRef.current === controller) {
        reportRef.current = null;
        setReporting(false);
      }
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await runAnalysis(inputs);
  }

  function cancelAnalysis() {
    requestRef.current?.abort();
    requestRef.current = null;
    setSlowRequest(false);
    setProgress("idle");
    setError({ code: "request_canceled", message: "Analysis canceled. Your inputs are still available." });
  }

  function clearDemo() {
    requestRef.current?.abort();
    reportRef.current?.abort();
    requestRef.current = null;
    reportRef.current = null;
    setInputs(emptyInputs);
    setResult(null);
    setResultSignature(null);
    setProgress("idle");
    setError(null);
    setReportError(null);
    setReporting(false);
    setDemoLoaded(false);
    setLabRuns([]);
    setActiveRunId(null);
    setLabNotice(null);
    setInitialFindingId(null);
    setPreferredBaselineId(null);
  }

  function startNewAnalysis() {
    requestRef.current?.abort();
    reportRef.current?.abort();
    requestRef.current = null;
    reportRef.current = null;
    setInputs(emptyInputs);
    setResult(null);
    setResultSignature(null);
    setProgress("idle");
    setError(null);
    setReportError(null);
    setReporting(false);
    setSlowRequest(false);
    setDemoLoaded(false);
    setLabRuns([]);
    setActiveRunId(null);
    setLabNotice(null);
    setInitialFindingId(null);
    setPreferredBaselineId(null);
    document.getElementById("workspace-title")?.focus({ preventScroll: true });
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const updateRunReviewState = useCallback((decisions: ReviewDecisions, notes: ReviewNotes) => {
    if (!activeRunId) return;
    setLabRuns((current) => current.map((run) => run.runId === activeRunId ? { ...run, reviewState: decisions, notes } : run));
  }, [activeRunId]);

  function inspectLabRun(runId: string, findingId?: string) {
    const run = labRuns.find((item) => item.runId === runId);
    if (!run) return;
    setActiveRunId(runId);
    setResult(run.analysis);
    setResultSignature(run.inputIdentity === signature ? signature : null);
    setInitialFindingId(findingId ?? null);
    window.setTimeout(() => document.getElementById(findingId ? "evidence-explorer" : "summary")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function clearResumeLab() {
    setLabRuns([]);
    setActiveRunId(null);
    setLabNotice("Resume Lab session state cleared.");
    setInitialFindingId(null);
    setPreferredBaselineId(null);
    setResult(null);
    setResultSignature(null);
  }

  function loadNextDemoVariant() {
    const index = Math.min(new Set(labRuns.map((run) => run.resumeIdentity)).size, SYNTHETIC_DEMO_VARIANTS.length - 1);
    setInputs({ analysisMode: analysisModes[0], resumeFiles: [], resumeText: SYNTHETIC_DEMO_VARIANTS[index], jobFile: null, jobText: SYNTHETIC_DEMO_JOB });
    setDemoLoaded(true);
    setError(null);
    setReportError(null);
    setProgress("idle");
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function runTemporaryRevision(revisionText: string, baselineId: string): Promise<boolean> {
    const revisionInputs: AnalysisInputs = {
      ...inputs,
      resumeFiles: [],
      resumeText: revisionText,
    };
    return runAnalysis(revisionInputs, "temporary_text_revision", baselineId);
  }

  return (
    <>
      <section id="workspace" className="workspace shell" aria-labelledby="workspace-title" data-analysis-state={analysisState}>
        <div className="section-intro">
          <p className="eyebrow"><span /> Analysis workspace</p>
          <h2 id="workspace-title" tabIndex={-1}>Two inputs. One precise lexical map.</h2>
          <p>Files are validated by the API and processed only for this request.</p>
        </div>
        <div className="document-state-rail" aria-label="Document analysis state">
          <div className="document-state-node"><span>DOCUMENT // RÉSUMÉ</span><strong>{inputs.resumeFiles.length ? `${inputs.resumeFiles.length} file${inputs.resumeFiles.length === 1 ? "" : "s"}` : inputs.resumeText.trim() ? "Pasted text" : "Awaiting input"}</strong></div>
          <div className="document-state-core" aria-hidden="true">LEX</div>
          <div className="document-state-node"><span>DOCUMENT // ROLE</span><strong>{inputs.jobFile ? "1 file" : inputs.jobText.trim() ? "Pasted text" : "Awaiting input"}</strong></div>
        </div>
        <ol className="workflow-steps" aria-label="Analysis workflow">
          <li><span>01</span><strong>Add both inputs</strong><small>Upload, paste, or combine résumé sources.</small></li>
          <li><span>02</span><strong>Choose a mode</strong><small>Use focused relevance or v1.0 compatibility.</small></li>
          <li><span>03</span><strong>Scan and review</strong><small>Interpret opportunities before editing.</small></li>
        </ol>
        {demoLoaded && (
          <div className="demo-banner" role="status">
            <FlaskConical size={17} aria-hidden="true" />
            <span><strong>Synthetic demo loaded.</strong> These fictional inputs use the real deterministic engine.</span>
            <button type="button" onClick={clearDemo}><RotateCcw size={14} /> Clear demo</button>
          </div>
        )}
        <form onSubmit={submit} noValidate>
          <fieldset className="mode-switcher">
            <legend>Analysis mode</legend>
            {analysisModes.map((mode) => (
              <label key={mode}>
                <input
                  type="radio"
                  name="analysis-mode"
                  value={mode}
                  checked={inputs.analysisMode === mode}
                  onChange={() => update("analysisMode", mode as AnalysisMode)}
                />
                <span><strong>{mode.replace(" analysis", "")}</strong><small>{mode.startsWith("Skills") ? "Curated relevance view" : "v1.0 compatibility"}</small></span>
              </label>
            ))}
          </fieldset>
          <p className="mode-help"><a className="context-link" href="/help#analysis-modes">Compare the two analysis modes</a></p>

          <div className="input-grid">
            <article className="input-panel">
              <div className="panel-kicker"><FileSearch size={16} /> INPUT 01 / RÉSUMÉ</div>
              <h3>Add résumé content</h3>
              <p>Upload up to five documents, paste text, or combine both sources.</p>
              <FileDropZone
                label="Résumé files"
                description="Multiple files combine into one lexical comparison."
                files={inputs.resumeFiles}
                multiple
                onFiles={(files) => update("resumeFiles", files)}
              />
              {resumeError && <p className="field-error" role="alert">{resumeError}</p>}
              <div className="text-divider"><span>OR PASTE / COMBINE</span></div>
              <label className="editor-field">
                <span>Résumé text</span>
                <textarea
                  aria-label="Résumé text"
                  value={inputs.resumeText}
                  onChange={(event) => update("resumeText", event.target.value)}
                  placeholder="Paste résumé text here…"
                  rows={10}
                  maxLength={MAX_TEXT_CHARACTERS}
                />
                <small>{inputs.resumeText.length.toLocaleString()} / {MAX_TEXT_CHARACTERS.toLocaleString()} characters</small>
              </label>
            </article>

            <article className="input-panel">
              <div className="panel-kicker"><ScanSearch size={16} /> INPUT 02 / ROLE</div>
              <h3>Add the job description</h3>
              <p>Paste the complete role description for the most useful comparison.</p>
              <FileDropZone
                label="Job-description file"
                description="Manual text below takes precedence when both are supplied."
                files={inputs.jobFile ? [inputs.jobFile] : []}
                onFiles={(files) => update("jobFile", files[0] ?? null)}
              />
              {jobError && <p className="field-error" role="alert">{jobError}</p>}
              <div className="text-divider"><span>OR PASTE / OVERRIDE</span></div>
              <label className="editor-field">
                <span>Job-description text</span>
                <textarea
                  aria-label="Job-description text"
                  value={inputs.jobText}
                  onChange={(event) => update("jobText", event.target.value)}
                  placeholder="Paste the role responsibilities, requirements, and preferred qualifications…"
                  rows={10}
                  maxLength={MAX_TEXT_CHARACTERS}
                />
                <small>{inputs.jobText.length.toLocaleString()} / {MAX_TEXT_CHARACTERS.toLocaleString()} characters</small>
              </label>
            </article>
          </div>

          <div className="analysis-action">
            <div><LockKeyhole size={15} /><span><strong>No third-party AI</strong><small>Request-scoped lexical processing</small></span></div>
            <button className="scan-button" type="submit" disabled={!ready || progress === "analyzing"}>
              {progress === "analyzing" ? "Analyzing…" : "Run Keyword Scan"}
              <ArrowRight size={17} />
            </button>
            {progress === "analyzing" && (
              <button className="button button-quiet cancel-analysis" type="button" onClick={cancelAnalysis}>Cancel</button>
            )}
          </div>
          {!ready && <p className="readiness-note">Add résumé content and a job description to begin.</p>}
          <ProgressStatus stage={progress} />
          {slowRequest && (
            <p className="cold-start-note" role="status">Analysis service may take a moment to start. Your inputs will remain available if the request times out. <a className="context-link" href="/help#timeouts">Troubleshoot delays</a></p>
          )}
          {error && (
            <div className="api-error" role={error.code === "request_canceled" ? "status" : "alert"}>
              <strong>We couldn’t complete that request.</strong>
              <span>{error.message}</span>
              {error.request_id && <small>Reference: {error.request_id}</small>}
              <a className="context-link" href="/help#document-errors">Understand common errors</a>
              {ready && <button className="button button-quiet" type="button" onClick={() => runAnalysis()}>Retry analysis</button>}
            </div>
          )}
        </form>
      </section>

      {result && (
        <ResultsDashboard
          result={result}
          stale={stale}
          reporting={reporting}
          reportError={reportError}
          analysisKey={activeRunId ?? resultSignature ?? "unkeyed"}
          onDownload={downloadReport}
          onNewAnalysis={startNewAnalysis}
          initialSelectedFindingId={initialFindingId}
          initialReviewDecisions={labRuns.find((run) => run.runId === activeRunId)?.reviewState}
          initialReviewNotes={labRuns.find((run) => run.runId === activeRunId)?.notes}
          onReviewStateChange={updateRunReviewState}
        />
      )}
      {labRuns.length > 0 && <ResumeLab
        runs={labRuns}
        activeRunId={activeRunId}
        notice={labNotice}
        demoAvailable={demoLoaded}
        onSelectRun={inspectLabRun}
        onClear={clearResumeLab}
        onLoadDemoVariant={loadNextDemoVariant}
        revisionSeed={inputs.resumeText}
        revisionRunning={progress === "analyzing"}
        preferredBaselineId={preferredBaselineId}
        onRunRevision={runTemporaryRevision}
      />}
    </>
  );
}
