"use client";

import { Activity, Braces, DatabaseZap, Gauge, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import type { AnalysisResponse, AnalysisViewModel } from "@/lib/contracts";

interface PerformanceSnapshot {
  domReady: number;
  loaded: number;
}

export function SystemTransparency({ result }: { result: AnalysisResponse | AnalysisViewModel }) {
  const [showPerformance, setShowPerformance] = useState(false);
  const [performanceSnapshot, setPerformanceSnapshot] = useState<PerformanceSnapshot | null>(null);

  useEffect(() => {
    const entry = typeof performance.getEntriesByType === "function"
      ? performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
      : undefined;
    if (!entry) return;
    setPerformanceSnapshot({ domReady: Math.round(entry.domContentLoadedEventEnd), loaded: Math.round(entry.loadEventEnd) });
  }, []);

  return (
    <section className="system-transparency" aria-labelledby="system-transparency-title">
      <header><div><p className="mono-label">ABOUT THIS SYSTEM</p><h3 id="system-transparency-title">Deterministic by construction</h3><p>The interface renders one typed API response. It does not calculate a second score or infer unsupported source structure.</p></div><Braces size={28} aria-hidden="true" /></header>
      <ol className="system-runtime-map">
        <li><span><DatabaseZap size={16} /></span><div><strong>Request boundary</strong><small>Validated résumé and role inputs</small></div></li>
        <li><span><Activity size={16} /></span><div><strong>Python engine</strong><small>Parse → normalize → match → score</small></div></li>
        <li><span><ShieldCheck size={16} /></span><div><strong>Typed response</strong><small>{result.matched_terms.length + result.missing_terms.length} ordered returned terms</small></div></li>
        <li><span><Braces size={16} /></span><div><strong>Presentation</strong><small>Session-only review and export controls</small></div></li>
      </ol>
      <div className="system-boundary"><strong>Current evidence boundary</strong><p>{"evidenceContract" in result && result.evidenceContract.version === "2.0" ? "Canonical source text, exact matched offsets, and conservatively detected sections are authoritative when returned. Ambiguous structure, visual formatting quality, requirement severity, and hiring predictions remain unavailable." : "Term/category evidence and normalized explanations are authoritative. Exact source spans, section diagnostics, and hiring predictions are not part of this compatibility response."}</p><a href="/methodology">Inspect methodology and provenance boundaries</a></div>
      <button className="performance-toggle" type="button" aria-expanded={showPerformance} aria-controls="performance-hud" onClick={() => setShowPerformance((current) => !current)}><Gauge size={15} /> {showPerformance ? "Hide performance HUD" : "Show performance HUD"}</button>
      {showPerformance && (
        <div id="performance-hud" className="performance-hud" role="status">
          <span>LOCAL BROWSER TELEMETRY · NOT TRANSMITTED</span>
          <dl><div><dt>DOM ready</dt><dd>{performanceSnapshot ? `${performanceSnapshot.domReady} ms` : "Unavailable"}</dd></div><div><dt>Page load</dt><dd>{performanceSnapshot?.loaded ? `${performanceSnapshot.loaded} ms` : "Unavailable"}</dd></div><div><dt>Rendered terms</dt><dd>{result.matched_terms.length + result.missing_terms.length}</dd></div><div><dt>Categories</dt><dd>{result.categories.length}</dd></div></dl>
          <p>Browser Navigation Timing and current response counts only. No document content or timing value is stored or sent.</p>
        </div>
      )}
    </section>
  );
}
