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
        <Hero />
        <Analyzer />
      </main>
      <Footer />
    </>
  );
}
