import { Analyzer } from "@/components/analysis/analyzer";
import { Hero } from "@/components/shell/hero";
import { Navigation } from "@/components/shell/navigation";

export default function HomePage() {
  return (
    <main>
      <Navigation />
      <Hero />
      <Analyzer />
      <footer className="site-footer shell">
        <span>Resume Keyword Screener</span>
        <span>Private lexical analysis · No external AI</span>
      </footer>
    </main>
  );
}
