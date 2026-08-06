import { ArrowDown, BookOpen, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="hero shell" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow"><span /> Private résumé intelligence</p>
        <h1 id="hero-title">Map your résumé<br />to the role.</h1>
        <p className="hero-deck">
          Run a private lexical analysis and identify matched language, missing
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
        </div>
      </div>
      <div className="hero-visual" aria-label="Illustration of a résumé keyword scan">
        <div className="visual-grid" />
        <div className="document-orbit orbit-one" />
        <div className="document-orbit orbit-two" />
        <div className="scan-document">
          <div className="document-topline"><span>RÉSUMÉ / ROLE MAP</span><span>01</span></div>
          <div className="document-heading" />
          <div className="document-line wide" />
          <div className="document-line medium active" />
          <div className="document-line wide" />
          <div className="document-line short active violet" />
          <div className="document-line medium" />
          <div className="scan-line" />
          <div className="coverage-orb">
            <span>78%</span><small>COVERAGE</small>
          </div>
        </div>
        <div className="node node-a"><span /> MATCHED</div>
        <div className="node node-b"><span /> OPPORTUNITY</div>
      </div>
    </section>
  );
}
