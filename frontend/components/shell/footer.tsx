import Link from "next/link";

export function Footer() {
  return (
    <footer className="site-footer shell">
      <div>
        <strong>Resume Keyword Screener</strong>
        <span>Deterministic lexical analysis · No generative AI</span>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/methodology">Methodology</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/help">Help</Link>
        <a href="https://github.com/J321-D/resume-screener-bot" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://github.com/J321-D/resume-screener-bot/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a>
      </nav>
    </footer>
  );
}
