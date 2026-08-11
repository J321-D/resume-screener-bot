"use client";

import dynamic from "next/dynamic";
import { ArrowRight, FileSearch, FlaskConical, LockKeyhole, RotateCcw, ScanSearch } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { analyze, createReport, SLOW_REQUEST_NOTICE_MS } from "@/lib/api";
import { analysisModes, type AnalysisInputs, type AnalysisMode, type AnalysisResponse, type PublicError } from "@/lib/contracts";
import { inputSignature, MAX_TEXT_CHARACTERS, validateFiles } from "@/lib/formatting";
import { syntheticDemoInputs } from "@/components/demo/synthetic-demo";
import { FileDropZone } from "./file-drop-zone";
import { ProgressStatus, type ProgressStage } from "./progress-status";

const ResultsDashboard = dynamic(
  () => import("@/components/results/results-dashboard").then((module) => module.ResultsDashboard),
  { loading: () => <div className="results-skeleton" aria-label="Loading results presentation" /> },
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
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [resultSignature, setResultSignature] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressStage>("idle");
  const [error, setError] = useState<PublicError | null>(null);
  const [reportError, setReportError] = useState<PublicError | null>(null);
  const [reporting, setReporting] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const reportRef = useRef<AbortController | null>(null);

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
    if (new URLSearchParams(window.location.search).get("demo") !== "1") return;
    setInputs(syntheticDemoInputs());
    setDemoLoaded(true);
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

  async function runAnalysis() {
    if (!ready || progress === "analyzing") return;
    requestRef.current?.abort();
    const controller = new AbortController();
    const submittedInputs: AnalysisInputs = {
      ...inputs,
      resumeFiles: [...inputs.resumeFiles],
    };
    const submittedSignature = signature;
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
      if (requestRef.current !== controller) return;
      setResult(response);
      setResultSignature(submittedSignature);
      setProgress("complete");
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught as PublicError);
      setProgress("idle");
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
    await runAnalysis();
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
    document.getElementById("workspace-title")?.focus({ preventScroll: true });
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section id="workspace" className="workspace shell" aria-labelledby="workspace-title" data-analysis-state={analysisState}>
        <div className="section-intro">
          <p className="eyebrow"><span /> Analysis workspace</p>
          <h2 id="workspace-title" tabIndex={-1}>Two inputs. One precise lexical map.</h2>
          <p>Files are validated by the API and processed only for this request.</p>
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
              {ready && <button className="button button-quiet" type="button" onClick={runAnalysis}>Retry analysis</button>}
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
          analysisKey={resultSignature ?? "unkeyed"}
          onDownload={downloadReport}
          onNewAnalysis={startNewAnalysis}
        />
      )}
    </>
  );
}
