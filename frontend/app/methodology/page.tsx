import type { Metadata } from "next";
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
