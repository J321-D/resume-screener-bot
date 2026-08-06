import { Code2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Navigation() {
  return (
    <header className="topbar">
      <nav className="shell nav" aria-label="Primary navigation">
        <Link href="/" className="brand" aria-label="Resume Keyword Screener home">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>Resume Keyword Screener</span>
        </Link>
        <div className="nav-actions">
          <span className="privacy-pill"><ShieldCheck size={14} /> Local processing</span>
          <Link href="/methodology">Method</Link>
          <Link href="/privacy">Privacy</Link>
          <a
            href="https://github.com/J321-D/resume-screener-bot"
            aria-label="View source on GitHub"
            rel="noreferrer"
            target="_blank"
          ><Code2 size={17} /></a>
        </div>
      </nav>
    </header>
  );
}
