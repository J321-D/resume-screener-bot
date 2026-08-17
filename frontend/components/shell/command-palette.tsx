"use client";

import { ArrowDownToLine, BookOpenText, FilePlus2, FlaskConical, Gauge, HelpCircle, Map, ScanSearch, Search, Target, X } from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

interface Command {
  label: string;
  description: string;
  href?: string;
  selector?: string;
  icon: typeof Search;
}

const baseCommands: Command[] = [
  { label: "Analyze workspace", description: "Move to the résumé and role inputs", href: "/#workspace", icon: Search },
  { label: "Load synthetic demo", description: "Use fictional content with the real engine", href: "/?demo=1#workspace", icon: FlaskConical },
  { label: "Help and shortcuts", description: "Open task-oriented product guidance", href: "/help", icon: HelpCircle },
];

const contextualCommands: Command[] = [
  { label: "Review missing terms", description: "Move to the current opportunity queue", selector: ".review-workspace", icon: Target },
  { label: "Open Gap Mode", description: "Review unresolved opportunities one at a time", selector: "#gap-mode-trigger", icon: Target },
  { label: "Walk through result", description: "Open the deterministic result system map", selector: ".analysis-playback", icon: Map },
  { label: "Inspect evidence", description: "Open the authoritative TRACE explorer", selector: "#evidence-explorer", icon: Search },
  { label: "Open Document X-Ray", description: "Inspect canonical résumé and role evidence", selector: "#document-xray", icon: ScanSearch },
  { label: "Open Diagnostics", description: "Inspect factual rules evaluated for this request", selector: "#diagnostics", icon: Gauge },
  { label: "Open Machine View", description: "Inspect normalized fields for the selected finding", selector: ".machine-view summary", icon: Search },
  { label: "Open Resume Lab", description: "Inspect session-only retained runs", selector: "#resume-lab", icon: FlaskConical },
  { label: "Compare current runs", description: "Open the deterministic Diff Reactor", selector: "#diff-reactor", icon: Map },
  { label: "Open Revision Workspace", description: "Edit a session-only résumé copy and rerun explicitly", selector: "#revision-workspace", icon: FilePlus2 },
  { label: "Compare before and after", description: "Open the selected baseline/current comparison", selector: "#diff-reactor", icon: Map },
  { label: "Open run timeline", description: "Inspect ephemeral run history", selector: "#run-timeline", icon: Map },
  { label: "Clear comparison session", description: "Open the Resume Lab clear confirmation", selector: "#clear-resume-lab", icon: X },
  { label: "Open Living Report", description: "Move to the screen-first result record", selector: "#living-report summary", icon: BookOpenText },
  { label: "Export PDF report", description: "Generate the report for current inputs", selector: "#download-report", icon: ArrowDownToLine },
  { label: "New analysis", description: "Open the current-session reset confirmation", selector: "#new-analysis-trigger", icon: FilePlus2 },
];

export function CommandPalette({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [available, setAvailable] = useState<Command[]>(baseCommands);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      setQuery("");
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setAvailable([...baseCommands, ...contextualCommands.filter((command) => {
      const target = command.selector ? document.querySelector<HTMLElement>(command.selector) : null;
      return Boolean(target && !(target instanceof HTMLButtonElement && target.disabled));
    })]);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const commands = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized ? available.filter((command) => `${command.label} ${command.description}`.toLocaleLowerCase().includes(normalized)) : available;
  }, [available, query]);

  function close(restoreFocus = true) {
    setOpen(false);
    setQuery("");
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function run(command: Command) {
    if (!command.selector) return;
    const target = document.querySelector<HTMLElement>(command.selector);
    if (!target) return;
    close(false);
    onNavigate?.();
    if (target instanceof HTMLButtonElement || target.tagName === "SUMMARY") target.click();
    else {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  }

  function handlePaletteKeys(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(paletteRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input') ?? []);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <button ref={triggerRef} className="command-trigger" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <Search size={14} aria-hidden="true" /><span>Commands</span><kbd>⌘K</kbd>
      </button>
      {open && (
        <div className="command-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section ref={paletteRef} className="command-palette" role="dialog" aria-modal="true" aria-labelledby="command-title" onKeyDown={handlePaletteKeys}>
            <header><div><span>COMMAND INDEX</span><h2 id="command-title">Go directly to the next task.</h2></div><button type="button" aria-label="Close command palette" onClick={() => close()}><X size={18} /></button></header>
            <label className="command-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search commands</span><input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands" /></label>
            <div className="command-list" role="list">
              {commands.map((command) => {
                const Icon = command.icon;
                const content = <><Icon size={17} aria-hidden="true" /><span><strong>{command.label}</strong><small>{command.description}</small></span></>;
                return command.href
                  ? <a role="listitem" href={command.href} key={command.label} onClick={() => close(false)}>{content}</a>
                  : <button role="listitem" type="button" key={command.label} onClick={() => run(command)}>{content}</button>;
              })}
              {!commands.length && <p className="command-empty">No commands match “{query}”.</p>}
            </div>
            <footer><span><kbd>Esc</kbd> close</span><span>Only available actions are shown</span></footer>
          </section>
        </div>
      )}
    </>
  );
}
