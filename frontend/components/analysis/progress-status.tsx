"use client";

import { Check, LoaderCircle } from "lucide-react";

export type ProgressStage = "idle" | "preparing" | "analyzing" | "complete";

const stages = [
  ["preparing", "Preparing input"],
  ["analyzing", "Analyzing language"],
  ["complete", "Results ready"],
] as const;

export function ProgressStatus({ stage }: { stage: ProgressStage }) {
  if (stage === "idle") return null;
  const current = stages.findIndex(([key]) => key === stage);
  return (
    <div className="progress-status" role="status" aria-live="polite">
      <div className="progress-track"><span style={{ width: `${((current + 1) / stages.length) * 100}%` }} /></div>
      <ol>
        {stages.map(([key, label], index) => (
          <li key={key} className={index <= current ? "is-active" : ""}>
            <span aria-hidden="true">
              {index < current || stage === "complete" ? <Check size={12} /> : index === current ? <LoaderCircle size={12} /> : index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <span className="sr-only">{stages[current]?.[1]}</span>
    </div>
  );
}
