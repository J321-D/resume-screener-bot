import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/shell/footer";
import { Navigation } from "@/components/shell/navigation";

export const metadata: Metadata = {
  title: "Privacy · Resume Keyword Screener",
  description: "How submitted documents, temporary downloads, and aggregate page-view analytics are handled.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main id="main-content"><article className="prose-page shell">
      <Link href="/" className="back-link">← Back to the screener</Link>
      <p className="eyebrow">Privacy</p>
      <h1>Your documents are used only for the current request.</h1>
      <p>
        Résumé and job-description content is sent only to the configured Resume
        Keyword Screener API for the current request. The application has no
        document database or persistent disk, does not intentionally retain the
        content, and does not transmit it to AI providers or third-party
        résumé-processing services.
      </p>
      <p>
        Multipart infrastructure may temporarily spool larger uploads while a
        request is active. The API bounds the complete request before document
        parsing and closes framework-managed upload resources after processing.
        Hosting-provider operational metadata remains governed by the providers&apos;
        own policies.
      </p>
      <p>
        This Version 2 frontend is configured to use Vercel Web Analytics for
        anonymous aggregate page views, referrers, approximate region, browser,
        operating system, and device category. Analytics receives only the fixed
        public page path—never document text, filenames, extracted terms, report
        contents, or form input—and does not use analytics cookies or custom
        interaction events.
      </p>
      <h2>Exports and temporary browser resources</h2>
      <p>PDF reports and Markdown checklists are created only when you request them. Temporary browser download URLs are revoked after use; downloaded files remain under your browser and device controls.</p>
      <h2>Infrastructure metadata</h2>
      <p>Hosting providers may process ordinary operational metadata under their own policies. The application does not intentionally log document contents or send them to analytics.</p>
      </article></main>
      <Footer />
    </>
  );
}
