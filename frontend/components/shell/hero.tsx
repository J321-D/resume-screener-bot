import { ArrowDown, BookOpen, FlaskConical, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span /> Deterministic lexical analysis</p>
        <h1 id="hero-title">Map your résumé<br />to the role.</h1>
        <p className="hero-deck">
          Run a privacy-conscious lexical analysis and identify matched language, missing
          concepts, and coverage opportunities.
        </p>
        <p className="hero-disclaimer">
          <ShieldCheck size={16} aria-hidden="true" />
          Lexical keyword comparison—not a candidate-performance assessment.
        </p>
        <div className="hero-actions">
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
        </div>
      </div>
      <div className="hero-visual" role="img" aria-label="Illustration of a résumé keyword scan">
        <div className="hero-bloom bloom-cyan" aria-hidden="true" />
        <div className="visual-grid" aria-hidden="true" />
        <div className="visual-plate plate-back" aria-hidden="true" />
        <div className="visual-plate plate-mid" aria-hidden="true" />
        <div className="document-orbit orbit-one" aria-hidden="true" />
        <div className="document-orbit orbit-two" aria-hidden="true" />
        <div className="scan-document">
          <div className="document-reflection" aria-hidden="true" />
          <div className="document-topline"><span>RÉSUMÉ / ROLE MAP</span><span>01</span></div>
          <div className="document-heading" />
          <div className="document-line wide" />
          <div className="document-line medium active" />
          <div className="document-line wide" />
          <div className="document-line short active violet" />
          <div className="document-line medium" />
          <div className="scan-line" />
          <div className="coverage-orb">
            <span>LEX</span><small>COVERAGE MAP</small>
          </div>
        </div>
        <div className="node node-a"><span /> MATCHED TERMS</div>
        <div className="node node-b"><span /> REVIEW TERMS</div>
      </div>
    </section>
  );
}
