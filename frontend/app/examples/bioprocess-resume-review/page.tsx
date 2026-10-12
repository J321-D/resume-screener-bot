import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/shell/footer";
import { Navigation } from "@/components/shell/navigation";

export const metadata: Metadata = {
  title: "Bioprocess Engineer Résumé Keyword Example · Resume Keyword Screener",
  description:
    "A fictional upstream bioprocess résumé and job-description comparison, showing exact keyword matches, gaps to review, and why lexical overlap is not hiring advice.",
  alternates: { canonical: "/examples/bioprocess-resume-review" },
  openGraph: {
    title: "Bioprocess résumé keyword comparison — a worked example",
    description: "A transparent fictional example of matching and missing bioprocess-development concepts. No ATS pass predictions.",
    url: "/examples/bioprocess-resume-review",
    type: "article",
  },
};

const role = [
  "Mammalian cell culture",
  "Shake-flask experiments",
  "Bioreactor sampling",
  "Design of experiments (DOE)",
  "GMP batch records",
  "Technology transfer",
] as const;

const matched = [
  { phrase: role[0], evidence: "Performed mammalian cell culture" },
  { phrase: role[1], evidence: "Conducted shake-flask experiments" },
] as const;

const unverified = [
  { phrase: role[2], reason: "Shake-flask work does not establish bioreactor sampling." },
  { phrase: role[3], reason: "Running experiments does not establish DOE methodology." },
  { phrase: role[4], reason: "Laboratory notes are not automatically GMP batch records." },
  { phrase: role[5], reason: "Internal documentation does not establish technology transfer." },
] as const;

export default function BioprocessExamplePage() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="shell pb-20 pt-10 sm:pt-16">
        <nav aria-label="Breadcrumb" className="mb-9 text-sm text-[#a9b3c8]">
          <Link href="/" className="underline underline-offset-4 hover:text-[#53e5ff]">Resume Screener</Link>
          <span aria-hidden="true"> / </span>
          <span>Bioprocess example</span>
        </nav>
        <header className="max-w-4xl">
          <p className="mb-5 font-mono text-xs uppercase tracking-[.15em] text-[#53e5ff]">Worked example · Biopharma careers</p>
          <h1 className="text-4xl font-semibold tracking-tight text-[#f6f8fc] sm:text-6xl">
            How to compare a bioprocess résumé with a job description
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#a9b3c8] sm:text-lg">
            When a job posting asks for bioreactor sampling, GMP batch records, and
            mammalian cell culture, which terms does your résumé actually support?
            This <strong className="font-medium text-[#f6f8fc]">fictional, manually illustrated example</strong> separates
            explicit overlap from concepts that require honest review. It is not a live
            analysis result, résumé score, ATS test, or hiring assessment.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#workspace" className="inline-flex min-h-11 items-center rounded-xl bg-[#53e5ff] px-5 py-3 font-semibold text-[#07101b] hover:bg-[#a5f3fc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#53e5ff]">
              Analyze my own résumé <span className="ml-2" aria-hidden="true">↗</span>
            </Link>
            <Link href="/methodology" className="inline-flex min-h-11 items-center rounded-xl border border-[#456078] px-5 py-3 font-medium text-[#e3effb] hover:border-[#53e5ff] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#53e5ff]">
              Read the methodology
            </Link>
          </div>
        </header>

        <section className="mt-14 grid gap-5 lg:grid-cols-2" aria-labelledby="input-example">
          <h2 id="input-example" className="sr-only">Fictional input excerpts</h2>
          <article className="rounded-2xl border border-[#34475d] bg-[#101c2d] p-6">
            <p className="mb-4 font-mono text-xs tracking-[.12em] text-[#82d9ff]">01 / FICTIONAL JOB REQUIREMENTS</p>
            <p className="leading-8 text-[#e0eafa]">
              Assist upstream process-development experiments involving mammalian cell culture,
              shake-flask experiments, bioreactor sampling, design of experiments (DOE),
              GMP batch records, and technology transfer.
            </p>
            <p className="mt-6 text-xs leading-5 text-[#9caec3]">Illustrative job posting; not from an employer or a live listing.</p>
          </article>
          <article className="rounded-2xl border border-[#34475d] bg-[#101c2d] p-6">
            <p className="mb-4 font-mono text-xs tracking-[.12em] text-[#82d9ff]">02 / FICTIONAL RÉSUMÉ EXCERPT</p>
            <p className="leading-8 text-[#e0eafa]">
              Performed mammalian cell culture and conducted shake-flask experiments.
              Collected samples and maintained laboratory notebook records for upstream R&amp;D work.
            </p>
            <p className="mt-6 text-xs leading-5 text-[#9caec3]">Synthetic candidate example; not a real person, customer, or recorded resume upload.</p>
          </article>
        </section>

        <section className="mt-12" aria-labelledby="map-title">
          <p className="mb-3 font-mono text-xs uppercase tracking-[.12em] text-[#a9b3c8]">03 / The evidence map</p>
          <h2 id="map-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Two explicit overlaps. Four review prompts.</h2>
          <p className="mt-3 max-w-3xl leading-7 text-[#a9b3c8]">
            These are hand-labeled teaching examples, <strong className="text-[#f6f8fc]">not the application's calculated categories or a coverage percentage</strong>.
            A missing phrase is a question to investigate, not an instruction to add an unearned claim.
          </p>
          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#315e59] bg-[#0f2727] p-5">
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#75e6b4]">Explicitly represented · 2</h3>
              <div className="space-y-4">
                {matched.map((item) => <article key={item.phrase} className="rounded-xl border border-[#2c514b] bg-[#102c2a] p-4">
                  <p className="font-semibold text-[#e3fff2]">{item.phrase}</p>
                  <p className="mt-2 text-sm leading-6 text-[#bad9cf]">Source excerpt: “{item.evidence}”</p>
                </article>)}
              </div>
            </div>
            <div className="rounded-2xl border border-[#655439] bg-[#2b2318] p-5">
              <h3 className="mb-5 text-sm font-semibold uppercase tracking-widest text-[#f2be72]">Needs truthful review · 4</h3>
              <div className="space-y-3">
                {unverified.map((item) => <article key={item.phrase} className="rounded-xl border border-[#5a4a36] bg-[#2f261c] p-4">
                  <p className="font-semibold text-[#fff0d5]">{item.phrase}</p>
                  <p className="mt-2 text-sm leading-6 text-[#d2c2ab]">{item.reason}</p>
                </article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[#34475d] bg-[#111a2b] p-6 sm:p-8" aria-labelledby="review-title">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-[#53e5ff]">04 / Make the review useful</p>
          <h2 id="review-title" className="text-2xl font-semibold tracking-tight">What should a candidate do with the gaps?</h2>
          <ol className="mt-6 grid gap-5 text-[#bbc7d9] md:grid-cols-3">
            <li><strong className="mb-2 block text-[#f6f8fc]">Verify actual experience</strong>Look for real records, protocols, coursework, or projects that support the concept.</li>
            <li><strong className="mb-2 block text-[#f6f8fc]">Use specific language</strong>Only when accurate, explain where and how the skill was performed—without copying requirements you lack.</li>
            <li><strong className="mb-2 block text-[#f6f8fc]">Leave unsupported claims out</strong>Never relabel laboratory notes as GMP batch records or shake-flask work as bioreactor operation.</li>
          </ol>
        </section>

        <section className="mt-12 flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-[#366a79] bg-[#0e2731] p-6 sm:p-8" aria-labelledby="cta-title">
          <div className="max-w-2xl">
            <h2 id="cta-title" className="text-2xl font-semibold">Compare your own documents for free</h2>
            <p className="mt-3 leading-7 text-[#bbd4df]">
              Paste or upload a résumé and a job description. Review the actual lexical evidence,
              including its limitations. No payment or premium purchase is required.
            </p>
          </div>
          <Link href="/#workspace" className="inline-flex min-h-11 items-center rounded-xl bg-[#53e5ff] px-5 py-3 font-semibold text-[#07101b] hover:bg-[#a5f3fc] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#53e5ff]">
            Start the free analysis →
          </Link>
        </section>

        <footer className="mt-8 max-w-3xl text-sm leading-7 text-[#9caec3]">
          <p>Scope: English-first deterministic lexical comparison; no guarantee of ATS compatibility,
          recruiter screening, job interviews, or employment. The actual tool's curated taxonomy and normalization
          can produce different labels from this teaching example. Read the <Link href="/methodology" className="underline underline-offset-4 hover:text-[#53e5ff]">methodology</Link> and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-[#53e5ff]">privacy information</Link> before uploading documents.</p>
        </footer>
      </main>
      <Footer />
    </>
  );
}
