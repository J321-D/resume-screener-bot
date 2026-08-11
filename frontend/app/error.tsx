"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="route-state shell">
      <AlertTriangle size={28} aria-hidden="true" />
      <p className="eyebrow">Page error</p>
      <h1>This view could not be loaded.</h1>
      <p>Your documents were not saved by this page. Retry, or return to the analyzer.</p>
      <div className="route-state-actions">
        <button className="button button-primary" type="button" onClick={reset}><RotateCcw size={16} /> Retry</button>
        <Link className="button button-quiet" href="/">Return to analysis</Link>
      </div>
    </main>
  );
}
