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
      <p>
        This Version 2 frontend is configured to use Vercel Web Analytics for
        anonymous aggregate page views, referrers, approximate region, browser,
        operating system, and device category. Analytics receives only the fixed
        public page path—never document text, filenames, extracted terms, report
        contents, or form input—and does not use analytics cookies or custom
        interaction events.
      </p>
    </main>
  );
}
