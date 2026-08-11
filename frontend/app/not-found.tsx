import Link from "next/link";

import { Footer } from "@/components/shell/footer";
import { Navigation } from "@/components/shell/navigation";

export default function NotFound() {
  return (
    <>
      <Navigation />
      <main id="main-content" className="route-state shell">
        <p className="eyebrow">404 / Not found</p>
        <h1>That page is not part of this analysis workspace.</h1>
        <p>Return to the screener, or read how the deterministic comparison works.</p>
        <div className="route-state-actions">
          <Link className="button button-primary" href="/">Open analyzer</Link>
          <Link className="button button-quiet" href="/methodology">View methodology</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
