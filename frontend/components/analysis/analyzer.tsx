"use client";

import dynamic from "next/dynamic";
import { ArrowRight, FileSearch, LockKeyhole, ScanSearch } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";

import { analyze, createReport } from "@/lib/api";
import { analysisModes, type AnalysisInputs, type AnalysisMode, type AnalysisResponse, type PublicError } from "@/lib/contracts";
import { inputSignature, validateFiles } from "@/lib/formatting";
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

export function Analyzer() {
  const [inputs, setInputs] = useState<AnalysisInputs>(emptyInputs);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [resultSignature, setResultSignature] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressStage>("idle");
  const [error, setError] = useState<PublicError | null>(null);
  const [reporting, setReporting] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

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

  function update<T extends keyof AnalysisInputs>(key: T, value: AnalysisInputs[T]) {
    setInputs((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setError(null);
    setProgress("preparing");
    await Promise.resolve();
    setProgress("analyzing");
    try {
      const response = await analyze(inputs, controller.signal);
      setResult(response);
      setResultSignature(signature);
      setProgress("complete");
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught as PublicError);
      setProgress("idle");
    }
  }

  async function downloadReport() {
    if (stale || !result) return;
    setReporting(true);
    setError(null);
    try {
      const blob = await createReport(inputs);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "resume-keyword-report.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught as PublicError);
    } finally {
      setReporting(false);
    }
  }

  return (
    <>
      <section id="workspace" className="workspace shell" aria-labelledby="workspace-title">
        <div className="section-intro">
          <p className="eyebrow"><span /> Analysis workspace</p>
          <h2 id="workspace-title">Two inputs. One precise lexical map.</h2>
          <p>Files are validated by the API and processed only for this request.</p>
        </div>
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
                />
                <small>{inputs.resumeText.length.toLocaleString()} characters</small>
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
                />
                <small>{inputs.jobText.length.toLocaleString()} characters</small>
              </label>
            </article>
          </div>

          <div className="analysis-action">
            <div><LockKeyhole size={15} /><span><strong>No third-party AI</strong><small>Processed by the private lexical API</small></span></div>
            <button className="scan-button" type="submit" disabled={!ready || progress === "analyzing"}>
              {progress === "analyzing" ? "Analyzing…" : "Run Keyword Scan"}
              <ArrowRight size={17} />
            </button>
          </div>
          {!ready && <p className="readiness-note">Add résumé content and a job description to begin.</p>}
          <ProgressStatus stage={progress} />
          {error && (
            <div className="api-error" role="alert">
              <strong>We couldn’t complete that request.</strong>
              <span>{error.message}</span>
              {error.request_id && <small>Reference: {error.request_id}</small>}
            </div>
          )}
        </form>
      </section>

      {result && (
        <ResultsDashboard
          result={result}
          stale={stale}
          reporting={reporting}
          analysisKey={resultSignature ?? "unkeyed"}
          onDownload={downloadReport}
        />
      )}
    </>
  );
}
