"use client";

import { Check, ChevronLeft, ChevronRight, Map, Play, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { AnalysisResponse } from "@/lib/contracts";

interface AnalysisPlaybackProps {
  result: AnalysisResponse;
  reducedMotion: boolean;
}

function stagesForMode(isFocused: boolean) {
  return [
    {
      id: "summary",
      label: "Coverage",
      description: isFocused
        ? "Read categorized concept coverage and source metadata."
        : "Read raw lexical overlap and source metadata.",
    },
    { id: "fingerprint", label: "Signature", description: "Inspect the deterministic category/count signature." },
    {
      id: "findings",
      label: "Evidence",
      description: isFocused
        ? "Review represented curated concepts and categorized gaps."
        : "Review exact shared terms and unmatched JD terms.",
    },
    { id: "category-signal", label: "Categories", description: "Compare returned category coverage without reweighting it." },
    {
      id: "review",
      label: "Review",
      description: isFocused
        ? "Classify curated concepts to review using your own factual experience."
        : "Review curated relevant concepts separately from the raw lexical score.",
    },
    { id: "living-report", label: "Report", description: "Read the screen report or request the protected PDF." },
  ] as const;
}

export function AnalysisPlayback({ result, reducedMotion }: AnalysisPlaybackProps) {
  const isFocused = result.analysis_mode === "Skills-focused analysis";
  const stages = stagesForMode(isFocused);
  const scoredCategoryCount = result.categories.filter(
    (category) => category.category !== "Uncategorized" && category.total > 0,
  ).length;
  const [active, setActive] = useState(0);
  const [touring, setTouring] = useState(false);

  useEffect(() => {
    if (!touring) {
      delete document.documentElement.dataset.resultView;
      return;
    }
    document.documentElement.dataset.resultView = stages[active].id;
    document.getElementById(stages[active].id)?.focus({ preventScroll: true });
    document.getElementById(stages[active].id)?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [active, reducedMotion, touring]);

  useEffect(() => () => { delete document.documentElement.dataset.resultView; }, []);

  function select(index: number) {
    setActive(index);
    setTouring(true);
  }

  return (
    <section className="analysis-playback" aria-labelledby="playback-title">
      <header>
        <div><span className="mono-label">RESULT SYSTEM MAP</span><h3 id="playback-title">Walk through this analysis</h3><p>Six factual views of the same returned result. Playback changes presentation only.</p></div>
        <button type="button" aria-pressed={touring} onClick={() => setTouring((current) => !current)}>{touring ? <X size={15} /> : <Play size={15} />}{touring ? "End walkthrough" : "Start walkthrough"}</button>
      </header>
      <nav aria-label="Analysis result map">
        <ol>
          {stages.map((stage, index) => (
            <li key={stage.id} data-state={index === active && touring ? "active" : index < active && touring ? "visited" : "idle"}>
              <button type="button" aria-current={index === active && touring ? "step" : undefined} onClick={() => select(index)}>
                <span>{index < active && touring ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span><strong>{stage.label}</strong>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      {touring && (
        <div className="playback-console" role="status" aria-live="polite">
          <Map size={17} aria-hidden="true" />
          <div><span>STAGE {String(active + 1).padStart(2, "0")} / {String(stages.length).padStart(2, "0")}</span><strong>{stages[active].label}</strong><p>{stages[active].description}</p></div>
          <button type="button" aria-label="Previous walkthrough stage" disabled={active === 0} onClick={() => setActive((current) => Math.max(0, current - 1))}><ChevronLeft size={16} /></button>
          <button type="button" aria-label="Next walkthrough stage" disabled={active === stages.length - 1} onClick={() => setActive((current) => Math.min(stages.length - 1, current + 1))}><ChevronRight size={16} /></button>
        </div>
      )}
      <p className="playback-proof">
        {isFocused
          ? `Current response: ${result.coverage.matched} categorized represented · ${result.coverage.missing} categorized gaps · ${scoredCategoryCount} scored categories`
          : `Current response: ${result.coverage.matched} exact terms shared · ${result.coverage.missing} unmatched JD terms`}
      </p>
    </section>
  );
}
