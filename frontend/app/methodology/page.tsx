import Link from "next/link";

export default function MethodologyPage() {
  return (
    <main className="prose-page shell">
      <Link href="/" className="back-link">← Back to the screener</Link>
      <p className="eyebrow">Methodology</p>
      <h1>A deterministic lexical comparison—not an AI judgment.</h1>
      <p>
        Resume Keyword Screener compares language in supplied résumés with a job
        description. Skills-focused mode applies a documented curated taxonomy,
        phrase list, stop-word list, and synonym map. Full lexical mode preserves
        the original unique-token comparison.
      </p>
      <h2>What the result means</h2>
      <p>
        Keyword Coverage describes overlap in lexical terms. It does not measure
        candidate quality, predict hiring outcomes, or reproduce a specific ATS.
      </p>
      <h2>Limitations</h2>
      <ul>
        <li>Curated normalization does not understand every synonym or context.</li>
        <li>Scanned PDFs require OCR, which is not included.</li>
        <li>Multiple résumés are combined into one comparison.</li>
      </ul>
    </main>
  );
}
