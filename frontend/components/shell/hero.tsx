import { ArrowDown, BookOpen, FlaskConical, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { CoreField } from "./core-field";

export function Hero() {
  return (
    <section className="hero hero-boot shell" aria-labelledby="hero-title" data-hero-sequence="system-boot">
      <div className="hero-copy boot-material">
        <p className="eyebrow boot-stage boot-stage-1"><span /> Deterministic lexical analysis</p>
        <h1 id="hero-title" className="boot-stage boot-stage-2">Map your résumé<br />to the role.</h1>
        <p className="hero-deck boot-stage boot-stage-3">
          Run a privacy-conscious lexical analysis and identify matched language, missing
          concepts, and coverage opportunities.
        </p>
        <p className="hero-disclaimer boot-stage boot-stage-3">
          <ShieldCheck size={16} aria-hidden="true" />
          Lexical keyword comparison—not a candidate-performance assessment.
        </p>
        <div className="hero-actions boot-stage boot-stage-4">
          <a className="button button-primary" href="#workspace">
            Start analysis <ArrowDown size={16} />
          </a>
          <Link className="button button-quiet" href="/methodology">
            <BookOpen size={16} /> View methodology
          </Link>
          {/* A document navigation guarantees that same-route demo query state is consumed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button button-quiet" href="/?demo=1#workspace">
            <FlaskConical size={16} /> Try synthetic demo
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="button button-quiet cinematic-demo-link" href="/?demo=cinematic#workspace">
            <FlaskConical size={16} /> Cinematic demo
          </a>
        </div>
      </div>
      <div className="hero-visual boot-stage boot-stage-1" role="img" aria-label="Analysis core showing five deterministic lexical dimensions">
        <CoreField />
        <div className="hero-bloom bloom-cyan" aria-hidden="true" />
        <div className="visual-grid" aria-hidden="true" />
        <div className="energy-trace" aria-hidden="true" />
        <div className="core-feed core-feed-resume" aria-hidden="true"><span /><i>RÉSUMÉ</i></div>
        <div className="core-feed core-feed-role" aria-hidden="true"><span /><i>ROLE</i></div>
        <div className="core-scan-plane" aria-hidden="true" />
        <div className="analysis-core" aria-hidden="true">
          <div className="core-orbit core-orbit-outer" />
          <div className="core-orbit core-orbit-inner" />
          <svg className="core-segments" viewBox="0 0 240 240">
            <circle className="core-track" cx="120" cy="120" r="88" pathLength="100" />
            {[0, 1, 2, 3, 4].map((segment) => (
              <circle key={segment} className={`core-segment core-segment-${segment + 1}`} cx="120" cy="120" r="88" pathLength="100" />
            ))}
          </svg>
          <div className="core-center">
            <span className="core-pulse" />
            <strong>LEX</strong>
            <small>ANALYSIS CORE</small>
          </div>
        </div>
        <div className="core-label core-label-a"><span /> TECHNICAL</div>
        <div className="core-label core-label-b"><span /> QUALITY</div>
        <div className="core-label core-label-c"><span /> TOOLS</div>
        <div className="core-label core-label-d"><span /> EDUCATION</div>
        <div className="core-label core-label-e"><span /> EXPERIENCE</div>
        <div className="data-particles" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => <span key={index} />)}
        </div>
      </div>
    </section>
  );
}
