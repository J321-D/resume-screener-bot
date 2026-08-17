import type { Metadata } from "next";

import { Analyzer } from "@/components/analysis/analyzer";
import { Hero } from "@/components/shell/hero";
import { Footer } from "@/components/shell/footer";
import { Navigation } from "@/components/shell/navigation";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main id="main-content">
        <div className="spatial-environment" aria-hidden="true"><div className="spatial-coordinate-field" /><svg className="spatial-circuitry" viewBox="0 0 1600 1600" preserveAspectRatio="none"><path d="M0 240 H260 L350 330 H650" /><path d="M1600 300 H1330 L1240 390 H960" /><path d="M120 920 H420 L520 820 H1080 L1180 920 H1480" /><path d="M800 430 V680 M800 980 V1450" /></svg><div className="spatial-glass spatial-glass-a" /><div className="spatial-glass spatial-glass-b" /></div>
        <Hero />
        <Analyzer />
      </main>
      <Footer />
    </>
  );
}
