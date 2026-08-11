import type { Metadata } from "next";
import Link from "next/link";

import { HelpCenter } from "@/components/help/help-center";
import { Navigation } from "@/components/shell/navigation";
import { Footer } from "@/components/shell/footer";

export const metadata: Metadata = {
  title: "Help · Resume Keyword Screener",
  description: "Upload, analysis-mode, score, privacy, export, and timeout guidance.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <>
      <Navigation />
      <main id="main-content"><section className="prose-page shell help-page" aria-labelledby="help-title">
        <p className="eyebrow"><span /> Help center</p>
        <h1 id="help-title">Clear answers for a transparent lexical tool.</h1>
        <p className="prose-lede">Start with synthetic content, understand the two analysis modes, and use every opportunity as a prompt for truthful human review.</p>
        <HelpCenter />
        <Link className="back-link" href="/">← Return to analysis</Link>
      </section></main>
      <Footer />
    </>
  );
}
