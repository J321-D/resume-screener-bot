import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Footer } from "@/components/shell/footer";
import { Navigation } from "@/components/shell/navigation";

export const metadata: Metadata = {
  title: "Methodology · Resume Keyword Screener",
  description: "How the deterministic lexical comparison and its two analysis modes work.",
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
        the original unique-token comparison.
      </p>
      <section className="system-explorer" aria-labelledby="system-explorer-title">
        <p className="mono-label">INTERACTIVE SYSTEM MAP</p><h2 id="system-explorer-title">Follow the deterministic pipeline.</h2>
        <div className="system-flow">
          {[["01","Input","Files and text are bounded and validated."],["02","Parse","Supported documents become request-scoped text."],["03","Normalize","Documented tokens, phrases, and synonyms resolve."],["04","Compare","The protected Python engine computes lexical evidence."],["05","Review","Returned order, coverage, and explanations render unchanged."]].map(([index,title,copy]) => <details key={index}><summary><span>{index}</span><strong>{title}</strong></summary><p>{copy}</p></details>)}
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
        Full lexical coverage gives every unique job-description token equal
        weight. Repeated occurrences affect the ordering of missing terms, not
        the coverage score. Skills-focused coverage gives every categorized
        job-description concept equal weight and reports Uncategorized concepts
        separately.
      </p>
      <h2>Limitations</h2>
      <ul>
        <li>Curated normalization does not understand every synonym or context.</li>
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
