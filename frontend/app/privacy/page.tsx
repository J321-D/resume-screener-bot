import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="prose-page shell">
      <Link href="/" className="back-link">← Back to the screener</Link>
      <p className="eyebrow">Privacy</p>
      <h1>Your documents are used only for the current request.</h1>
      <p>
        Résumé and job-description content is sent only to the configured Resume
        Keyword Screener API. The service processes uploads in memory, does not
        intentionally persist them, and does not transmit them to AI providers or
        third-party résumé-processing services.
      </p>
    </main>
  );
}
