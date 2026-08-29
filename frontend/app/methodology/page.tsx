import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Footer } from "@/components/shell/footer";
import { Navigation } from "@/components/shell/navigation";

export const metadata: Metadata = {
  title: "Methodology · Resume Keyword Screener",
  description: "How the deterministic lexical comparison, curated Skills-focused mode, and Relevant Keyword Review work.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <>
      <Navigation />
      <main id="main-content"><article className="prose-page shell">
      <Link href="/" className="back-link">← Back to the screener</Link>
      <p className="eyebrow">Methodology</p>
      <h1>A deterministic lexical comparison—not an AI judgment.</h1>
      <p>
        Resume Keyword Screener compares language in supplied résumés with a job
        description. Skills-focused mode applies a documented curated taxonomy,
        phrase list, stop-word list, and synonym map. Full lexical mode preserves
        the original unique-token comparison. Relevant Keyword Review is an
        additive curated view that separates actionable technical and professional
        concepts from the raw Full lexical denominator without changing that score.
      </p>
      <section className="system-explorer" aria-labelledby="system-explorer-title">
        <p className="mono-label">INTERACTIVE SYSTEM MAP</p><h2 id="system-explorer-title">Follow the deterministic pipeline.</h2>
        <div className="system-flow">
          {[["01","Input","Files and text are bounded and validated."],["02","Parse","Supported documents become request-scoped text."],["03","Normalize","Documented tokens, phrases, and synonyms resolve."],["04","Compare","The protected Python engine computes lexical evidence."],["05","Review","Raw overlap and curated review signals render as separate factual views."]].map(([index,title,copy]) => <details key={index}><summary><span>{index}</span><strong>{title}</strong></summary><p>{copy}</p></details>)}
        </div>
      </section>
      <section className="exploded-core" aria-labelledby="exploded-core-title">
        <div><p className="mono-label">EXPLODED ANALYSIS CORE</p><h2 id="exploded-core-title">One result, separated into accountable layers.</h2><p>This diagram explains system ownership. It is architecture—not a résumé score, diagnostic, or live parser trace.</p></div>
        <div className="exploded-core-stack" role="img" aria-label="Exploded system view with transport, parsing, normalization, scoring, response, and presentation layers">
          {["Presentation","Typed response","Coverage and ranking","Normalization","Parsing","Validated transport"].map((layer, index) => <span key={layer} style={{ "--layer-index": index } as CSSProperties}><i>{String(6 - index).padStart(2,"0")}</i><strong>{layer}</strong></span>)}
        </div>
      </section>
      <h2 id="coverage">What the result means</h2>
      <p>
        Keyword Coverage describes overlap in lexical terms. It does not measure
        candidate quality, predict hiring outcomes, or reproduce a specific ATS.
      </p>
      <p>
        Full lexical coverage is a raw compatibility baseline: every unique
        job-description token receives equal weight. Repeated occurrences affect
        the ordering of missing terms, not the coverage score. Generic words can
        therefore appear in raw matched or unmatched lists; they are labeled as
        raw terms rather than résumé skills or recommendations.
      </p>
      <p>
        Skills-focused coverage gives every categorized job-description concept
        equal weight and reports Uncategorized concepts separately. The result
        states how many curated role concepts form the score denominator so a
        sparse taxonomy match cannot be mistaken for whole-document coverage.
      </p>
      <p>
        Relevant Keyword Review is separate from both score denominators. It uses
        only explicitly curated categorized concepts and aliases, preserves exact
        source evidence, and marks each concept represented or missing. A missing
        concept is a review prompt only; it is not evidence that the résumé should
        claim experience the user does not have.
      </p>
      <h2>Normalization boundaries</h2>
      <p>
        Equivalences are explicit and regression-tested. The system does not infer
        related experience. For example, a Bradford assay does not imply protein
        purification, scale-up does not imply technology transfer, experimental
        design does not silently become design of experiments, and cell culture
        does not imply protein expression.
      </p>
      <h2>Limitations</h2>
      <ul>
        <li>Curated normalization does not understand every synonym or context.</li>
        <li>Raw Full lexical overlap intentionally includes ordinary job-description vocabulary.</li>
        <li>Scanned PDFs require OCR, which is not included.</li>
        <li>Multiple résumés are combined into one comparison.</li>
      </ul>
      <h2 id="language">Language boundary</h2>
      <p>The current rules and curated taxonomy are English-first. Unicode text is handled safely, but the analyzer does not claim multilingual semantic understanding.</p>
      </article></main>
      <Footer />
    </>
  );
}
