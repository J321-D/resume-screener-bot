"use client";

import { motion, useReducedMotion } from "framer-motion";

export function CoverageRing({
  score,
  label = "Keyword coverage",
  reducedMotion,
}: {
  score: number | null;
  label?: string;
  reducedMotion?: boolean;
}) {
  const systemReducedMotion = useReducedMotion();
  const reduceMotion = reducedMotion ?? systemReducedMotion;
  const normalized = Math.max(0, Math.min(score ?? 0, 100));
  const circumference = 2 * Math.PI * 76;

  return (
    <div
      className="coverage-ring"
      role="img"
      aria-label={score === null ? `${label} not applicable` : `${score}% ${label.toLowerCase()}`}
    >
      <svg viewBox="0 0 180 180" aria-hidden="true">
        <circle className="ring-track" cx="90" cy="90" r="76" />
        <motion.circle
          className="ring-value"
          cx="90"
          cy="90"
          r="76"
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - normalized / 100) }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div aria-hidden="true"><strong>{score === null ? "N/A" : `${score.toFixed(1)}%`}</strong><span>{label.toUpperCase()}</span></div>
    </div>
  );
}
