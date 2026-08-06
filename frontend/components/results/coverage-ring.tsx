"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

export function CoverageRing({ score, reducedMotion }: { score: number | null; reducedMotion?: boolean }) {
  const systemReducedMotion = useReducedMotion();
  const reduceMotion = reducedMotion ?? systemReducedMotion;
  const normalized = Math.max(0, Math.min(score ?? 0, 100));
  const [displayed, setDisplayed] = useState(reduceMotion ? normalized : 0);
  const circumference = 2 * Math.PI * 76;

  useEffect(() => {
    if (reduceMotion) {
      setDisplayed(normalized);
      return;
    }
    setDisplayed(0);
    const start = performance.now();
    let frame = 0;
    const animate = (time: number) => {
      const progress = Math.min((time - start) / 650, 1);
      setDisplayed(normalized * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [normalized, reduceMotion]);

  return (
    <div className="coverage-ring" role="img" aria-label={score === null ? "Keyword coverage not applicable" : `${score}% keyword coverage`}>
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
      <div aria-hidden="true"><strong>{score === null ? "N/A" : `${displayed.toFixed(1)}%`}</strong><span>KEYWORD COVERAGE</span></div>
    </div>
  );
}
