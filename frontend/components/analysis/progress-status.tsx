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
  const label = stages[current]?.[1];
  const detail = stage === "complete"
    ? "The deterministic result is ready for review."
    : stage === "preparing"
    ? "Validating the current input snapshot."
    : "Comparing the submitted text. Analysis service may take a moment to start.";
  return (
    <div className={`progress-status is-${stage}`} role="status" aria-live="polite">
      <span className="progress-indicator" aria-hidden="true">
        {stage === "complete" ? <Check size={15} /> : <LoaderCircle size={15} />}
      </span>
      <span><strong>{label}</strong><small>{detail}</small></span>
    </div>
  );
}
