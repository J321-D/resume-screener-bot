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
      <section className="system-explorer privacy-explorer" aria-labelledby="privacy-explorer-title">
        <p className="mono-label">REQUEST LIFECYCLE</p><h2 id="privacy-explorer-title">What moves—and what remains.</h2>
        <ol className="privacy-flow"><li><strong>Browser</strong><span>You explicitly submit files or text.</span></li><li><strong>API memory</strong><span>Bounded inputs are processed for the request.</span></li><li><strong>Deterministic engine</strong><span>No external AI service receives the content.</span></li><li><strong>Result</strong><span>The response returns without application persistence.</span></li></ol>
      </section>
      <h2>Exports and temporary browser resources</h2>
      <p>PDF reports and Markdown checklists are created only when you request them. Temporary browser download URLs are revoked after use; downloaded files remain under your browser and device controls.</p>
      <h2>Document X-Ray disclosure</h2>
      <p>
        Contract v2 returns exact canonical document-view text to this tab for
        X-Ray. It is not anonymized and can be copied or captured by the user.
        The response is marked no-store and application code does not place this
        text in analytics, URLs, logs, or browser storage. Browser-memory clearing
        is not secure erasure.
      </p>
      <h2>Resume Lab session comparison</h2>
      <p>
        Resume Lab can retain up to five successful result view models and three
        résumé variants for one job description in the current page&apos;s React
        memory. The application does not write runs, files, source text, review decisions,
        notes, or comparisons to localStorage, sessionStorage, IndexedDB, URLs,
        analytics, or a server history. New analysis, Clear Resume Lab, demo
        clearing, refresh, and tab close release those application references.
        This is application-state clearing, not a guarantee of secure browser
        memory erasure.
      </p>
      <h2>Temporary revision copies</h2>
      <p>
        The Revision Workspace edits a temporary text copy in current React
        memory. It does not modify an uploaded PDF or DOCX, autosave, or submit
        while you type. Run Revision explicitly sends that text through the same
        no-store analysis request. Reset, Clear Resume Lab, New analysis,
        refresh, or tab close releases application references without claiming
        secure browser-memory erasure.
      </p>
      <h2>Infrastructure metadata</h2>
      <p>Hosting providers may process ordinary operational metadata under their own policies. The application does not intentionally log document contents or send them to analytics.</p>
      </article></main>
      <Footer />
    </>
  );
}
