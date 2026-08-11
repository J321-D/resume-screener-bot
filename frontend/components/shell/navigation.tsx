"use client";

import { Code2, Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const destinations = [
  { href: "/#workspace", label: "Analyze", activePath: "/" },
  { href: "/methodology", label: "Methodology", activePath: "/methodology" },
  { href: "/privacy", label: "Privacy", activePath: "/privacy" },
  { href: "/help", label: "Help", activePath: "/help" },
] as const;

export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className="topbar">
      <nav className="shell nav" aria-label="Primary navigation">
        <Link href="/" className="brand" aria-label="Resume Keyword Screener home">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>Resume Keyword Screener</span>
        </Link>
        <button
          ref={triggerRef}
          className="nav-menu-trigger"
          type="button"
          aria-controls="primary-menu"
          aria-expanded={open}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
        <div ref={menuRef} id="primary-menu" className={`nav-actions ${open ? "is-open" : ""}`}>
          <span className="privacy-pill"><ShieldCheck size={14} /> Request-scoped processing</span>
          {destinations.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.activePath ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a
            className="source-link"
            href="https://github.com/J321-D/resume-screener-bot"
            aria-label="View source on GitHub (opens in a new tab)"
            rel="noreferrer"
            target="_blank"
          ><Code2 size={17} /></a>
        </div>
      </nav>
    </header>
  );
}
