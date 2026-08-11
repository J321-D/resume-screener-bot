import type { Metadata } from "next";
import { CircleHelp, FileCheck2, ShieldCheck, Wrench } from "lucide-react";
import Link from "next/link";

import { Navigation } from "@/components/shell/navigation";
import { Footer } from "@/components/shell/footer";

export const metadata: Metadata = {
  title: "Help · Resume Keyword Screener",
  description: "Upload, analysis-mode, score, privacy, export, and timeout guidance.",
  alternates: { canonical: "/help" },
};

const topics = [
  {
    icon: CircleHelp,
    title: "What does coverage mean?",
    copy: "Coverage is deterministic lexical overlap. It is not candidate quality, hiring probability, or a prediction from a specific ATS.",
  },
  {
    icon: FileCheck2,
    title: "Which files work?",
    copy: "Use searchable PDF, DOCX, or UTF-8 TXT files up to 10 MB each. Scanned image-only PDFs need OCR before upload.",
  },
  {
    icon: ShieldCheck,
    title: "What happens to my documents?",
    copy: "The public frontend sends them to the configured Render API for in-memory processing. The application does not intentionally persist submitted content.",
  },
  {
    icon: Wrench,
    title: "Why might a request take longer?",
    copy: "The free API service can cold-start after inactivity. Keep this page open; if a bounded request times out, use Retry without re-entering your content.",
  },
] as const;

export default function HelpPage() {
  return (
    <>
      <Navigation />
      <main id="main-content"><section className="prose-page shell help-page" aria-labelledby="help-title">
        <p className="eyebrow"><span /> Help center</p>
        <h1 id="help-title">Clear answers for a transparent lexical tool.</h1>
        <p className="prose-lede">Start with synthetic content, understand the two analysis modes, and use every opportunity as a prompt for truthful human review.</p>
        <div className="help-grid">
          {topics.map(({ icon: Icon, title, copy }, index) => (
            <article className="help-card" id={["score", "uploads", "privacy", "timeouts"][index]} key={title}>
              <Icon size={20} aria-hidden="true" />
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <section className="help-section" aria-labelledby="mode-help-title">
          <h2 id="mode-help-title">Choose the right mode</h2>
          <p><strong>Skills-focused</strong> filters documented filler terms and applies only curated phrase, synonym, and taxonomy rules. <strong>Full lexical</strong> preserves the v1.0 unique-token compatibility behavior.</p>
        </section>
        <section className="help-section" id="review" aria-labelledby="review-help-title">
          <h2 id="review-help-title">Review opportunities, don’t copy them blindly</h2>
          <p>An opportunity is a term found in the role description but not the résumé under the selected mode. Classify it only after deciding whether it truthfully reflects your experience.</p>
        </section>
        <section className="help-section" id="exports" aria-labelledby="export-help-title">
          <h2 id="export-help-title">Export and start again</h2>
          <p>Download the PDF analysis or a checklist of terms you marked for consideration. Use New analysis to clear the current browser session before working with another document.</p>
        </section>
        <section className="help-section" aria-labelledby="feedback-title">
          <h2 id="feedback-title">Feedback without document data</h2>
          <p>Report a product issue or suggestion through GitHub. Never include résumé text, job-description text, filenames, or other personal information.</p>
          <a className="button button-quiet" href="https://github.com/J321-D/resume-screener-bot/issues/new" target="_blank" rel="noreferrer">Open a GitHub issue</a>
        </section>
        <Link className="back-link" href="/">← Return to analysis</Link>
      </section></main>
      <Footer />
    </>
  );
}
