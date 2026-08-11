"use client";

import { BookOpenCheck, CircleHelp, FileCheck2, Search, ShieldCheck, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

const categories = ["All", "Getting started", "Analysis", "Documents & privacy", "Review & export", "Troubleshooting"] as const;
type HelpCategory = (typeof categories)[number];

interface HelpTopic {
  id: string;
  category: Exclude<HelpCategory, "All">;
  question: string;
  answer: string;
  keywords: string;
  link?: { href: string; label: string; external?: boolean };
}

const topics: HelpTopic[] = [
  {
    id: "first-scan",
    category: "Getting started",
    question: "How do I run my first scan?",
    answer: "Add résumé content, add the complete job description, choose an analysis mode, and run the scan. Review the score and ordered terms, classify truthful opportunities, then export or edit and rerun.",
    keywords: "onboarding workflow begin start",
    link: { href: "/?demo=1#workspace", label: "Load the synthetic demo" },
  },
  {
    id: "analysis-modes",
    category: "Analysis",
    question: "Which analysis mode should I choose?",
    answer: "Skills-focused is the default relevance-focused lexical view. It uses only documented stop words, phrases, synonyms, and categories. Full lexical preserves the v1.0 unique-token behavior for direct compatibility checks.",
    keywords: "skills focused full lexical mode compatibility",
    link: { href: "/methodology", label: "Read the methodology" },
  },
  {
    id: "coverage",
    category: "Analysis",
    question: "What does 66.7% coverage mean?",
    answer: "It means two of three equally weighted unique job-description tokens or categorized concepts matched under the selected mode. It does not mean a 66.7% chance of passing an ATS or being hired.",
    keywords: "score percentage formula 66.7 weighting ATS",
  },
  {
    id: "matched-opportunities",
    category: "Analysis",
    question: "Why is a term matched or listed as an opportunity?",
    answer: "A matched term is represented in both analyzed inputs under deterministic rules. An opportunity appears in the job description but not the combined résumé input. Add it only where it truthfully reflects your experience.",
    keywords: "matched missing term opportunity why",
  },
  {
    id: "categories",
    category: "Analysis",
    question: "How do categories and Uncategorized work?",
    answer: "The curated taxonomy groups known concepts. Uncategorized keeps meaningful unknown terms visible but excludes them from the primary Skills-focused score; its lexical coverage is reported separately.",
    keywords: "taxonomy uncategorized category N/A concepts",
  },
  {
    id: "uploads",
    category: "Documents & privacy",
    question: "Which documents can I use?",
    answer: "Use searchable PDF, DOCX, or UTF-8 TXT files up to 10 MB each. The request can include up to five résumés, 25 MB of files in total, and 200,000 characters per pasted field or extracted document. Image-only PDFs need OCR before upload.",
    keywords: "PDF DOCX TXT upload size file OCR scanned limits",
  },
  {
    id: "input-precedence",
    category: "Documents & privacy",
    question: "What happens when I upload and paste content?",
    answer: "Résumé files and pasted résumé text are combined into one comparison corpus. Pasted job-description text takes precedence over an uploaded job description. The interface labels both rules before submission.",
    keywords: "multiple resumes combine union upload paste precedence override",
  },
  {
    id: "document-errors",
    category: "Documents & privacy",
    question: "Why was my document rejected?",
    answer: "The API safely rejects unsupported, empty, oversized, malformed, encrypted, image-only, binary-text, or suspicious DOCX archive content. Convert scans with OCR, remove a password, or save a clean supported file before retrying.",
    keywords: "invalid malformed corrupt encrypted oversized binary archive rejected",
  },
  {
    id: "privacy-lifecycle",
    category: "Documents & privacy",
    question: "What happens to my résumé and job description?",
    answer: "The public frontend sends them to the configured Render API for the current request. The application does not intentionally persist document content, closes upload resources, marks analysis responses no-store, and excludes all document and form content from analytics.",
    keywords: "privacy storage persistence retention analytics Render data",
    link: { href: "/privacy", label: "Read the privacy details" },
  },
  {
    id: "review-workspace",
    category: "Review & export",
    question: "How should I review opportunities?",
    answer: "Classify each ordered term as Add to résumé, Already represented, Not relevant, or Review later. Reviewed means you made a decision—not that the résumé is optimized. Search and filters never rerank engine output.",
    keywords: "review status filter search checklist optimize",
  },
  {
    id: "rerun",
    category: "Review & export",
    question: "How do I revise and rerun safely?",
    answer: "Edit either input and the existing result becomes visibly stale; export and review decisions are disabled until you run a fresh scan. New analysis requires confirmation and clears the current in-page session.",
    keywords: "stale edit rerun reset new analysis decisions",
  },
  {
    id: "exports",
    category: "Review & export",
    question: "What can I export?",
    answer: "Download a Unicode-safe server-generated PDF for the current input signature, print the visible results, copy a factual summary or selected terms, or download a plain Markdown checklist. Temporary browser download URLs are revoked after use.",
    keywords: "PDF Markdown copy print report download export",
  },
  {
    id: "timeouts",
    category: "Troubleshooting",
    question: "Why is analysis slow or unavailable?",
    answer: "The free API service can cold-start after inactivity. The client uses a bounded 45-second request, preserves inputs, supports cancellation, and offers manual retry. It never invents progress stages or automatically repeats a POST request.",
    keywords: "timeout cold start slow 429 502 503 504 network offline retry cancel",
  },
  {
    id: "report-errors",
    category: "Troubleshooting",
    question: "What should I do if the PDF fails?",
    answer: "Your successful analysis remains visible. Retry the report from the export section. Changing inputs or starting a new analysis cancels an in-flight report so an old document cannot download after the session is cleared.",
    keywords: "PDF report failure retry download cancel",
  },
  {
    id: "keyboard-access",
    category: "Troubleshooting",
    question: "Can I use the screener with a keyboard or assistive technology?",
    answer: "Yes. Use standard Tab, Shift+Tab, Enter, Space, arrow-key, and native form-control behavior. Escape closes the mobile menu and confirmation prompts. Results receive focus after a successful scan, and reduced-motion and forced-color preferences are respected.",
    keywords: "accessibility keyboard screen reader focus reduced motion forced colors",
  },
  {
    id: "glossary",
    category: "Getting started",
    question: "What do lexical, deterministic, and normalization mean?",
    answer: "Lexical means text-based. Deterministic means the same inputs and rules produce the same result. Normalization means only explicitly documented forms—such as QC and quality control—map to one concept. No AI, fuzzy matching, or hidden hiring model is used.",
    keywords: "glossary lexical deterministic normalization synonym phrase AI",
  },
  {
    id: "feedback",
    category: "Troubleshooting",
    question: "How can I report a problem or suggestion?",
    answer: "Use the public GitHub issue form with synthetic examples only. GitHub stores submitted issues under its own account and retention policies; the screener itself stores no feedback. Never include résumé text, job-description text, filenames, credentials, or other personal information.",
    keywords: "feedback contact question issue bug suggestion support",
    link: { href: "https://github.com/J321-D/resume-screener-bot/issues/new", label: "Open a GitHub issue", external: true },
  },
];

const categoryIcons = {
  "Getting started": BookOpenCheck,
  Analysis: CircleHelp,
  "Documents & privacy": ShieldCheck,
  "Review & export": FileCheck2,
  Troubleshooting: Wrench,
} as const;

export function HelpCenter() {
  const [category, setCategory] = useState<HelpCategory>("All");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible = useMemo(() => topics.filter((topic) => {
    const categoryMatches = category === "All" || topic.category === category;
    const text = `${topic.question} ${topic.answer} ${topic.keywords}`.toLocaleLowerCase();
    return categoryMatches && (!normalizedQuery || text.includes(normalizedQuery));
  }), [category, normalizedQuery]);

  return (
    <section className="help-center" aria-labelledby="help-library-title">
      <div className="help-library-heading">
        <div>
          <p className="eyebrow"><span /> Guided answers</p>
          <h2 id="help-library-title">Find the next useful answer.</h2>
        </div>
        <label className="help-search">
          <span className="sr-only">Search help</span>
          <Search size={17} aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search scores, files, privacy, exports…" />
        </label>
      </div>

      <fieldset className="help-categories">
        <legend>Filter help topics</legend>
        {categories.map((item) => (
          <label key={item}>
            <input type="radio" name="help-category" checked={category === item} onChange={() => setCategory(item)} />
            <span>{item}</span>
          </label>
        ))}
      </fieldset>

      <p className="help-result-count" role="status" aria-live="polite">
        {visible.length} answer{visible.length === 1 ? "" : "s"}
      </p>
      <div className="help-answer-grid">
        {visible.map((topic) => {
          const Icon = categoryIcons[topic.category];
          return (
            <article id={topic.id} className="help-answer" key={topic.id}>
              <div className="help-answer-meta"><Icon size={16} aria-hidden="true" /><span>{topic.category}</span></div>
              <h3>{topic.question}</h3>
              <p>{topic.answer}</p>
              {topic.link && (
                <a href={topic.link.href} target={topic.link.external ? "_blank" : undefined} rel={topic.link.external ? "noreferrer" : undefined}>
                  {topic.link.label}{topic.link.external ? " ↗" : " →"}
                </a>
              )}
            </article>
          );
        })}
      </div>
      {!visible.length && (
        <div className="help-empty" role="status">
          <Search size={20} aria-hidden="true" />
          <strong>No matching answer.</strong>
          <span>Clear the search or choose All to browse the complete help library.</span>
          <button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button>
        </div>
      )}
    </section>
  );
}
