"use client";

import { Check, LoaderCircle } from "lucide-react";

export type ProgressStage = "idle" | "preparing" | "analyzing" | "complete";

const stages = [
  ["preparing", "Input snapshot", "Validating the submitted files and text."],
  ["analyzing", "Deterministic analysis", "Waiting for the server-side lexical engine."],
  ["complete", "Results assembled", "The verified response is ready for review."],
] as const;

export function ProgressStatus({ stage }: { stage: ProgressStage }) {
  if (stage === "idle") return null;
  const current = stages.findIndex(([key]) => key === stage);
  return (
    <div className={`analysis-timeline is-${stage}`} role="status" aria-live="polite" aria-label={`Analysis status: ${stages[current][1]}`}>
      <div className="timeline-trace" aria-hidden="true"><span style={{ width: `${((current + 1) / stages.length) * 100}%` }} /></div>
      <ol>
        {stages.map(([key, label, detail], index) => {
          const state = index < current ? "complete" : index === current ? "active" : "pending";
          return (
            <li className={`is-${state}`} key={key} aria-current={state === "active" ? "step" : undefined}>
              <span className="timeline-node" aria-hidden="true">
                {state === "complete" || (key === "complete" && stage === "complete") ? <Check size={14} /> : state === "active" ? <LoaderCircle size={14} /> : <span />}
              </span>
              <span><strong>{label}</strong><small>{detail}</small></span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only">{stages[current][2]}</p>
    </div>
  );
}
