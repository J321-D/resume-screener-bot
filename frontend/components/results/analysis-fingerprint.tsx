import type { AnalysisResponse } from "@/lib/contracts";
import type { CSSProperties } from "react";

interface AnalysisFingerprintProps {
  categories: AnalysisResponse["categories"];
  coverage: AnalysisResponse["coverage"];
}

export function fingerprintCode(categories: AnalysisResponse["categories"], coverage: AnalysisResponse["coverage"]) {
  const source = [
    coverage.score ?? "na",
    coverage.matched,
    coverage.missing,
    coverage.total,
    ...categories.flatMap((category) => [category.category, category.matched, category.total, category.score ?? "na"]),
  ].join("|");
  let hash = 2166136261;
  for (const character of source) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
}

export function AnalysisFingerprint({ categories, coverage }: AnalysisFingerprintProps) {
  const visibleCategories = categories.filter((category) => category.total > 0);
  const maxTotal = Math.max(1, ...visibleCategories.map((category) => category.total));
  const code = fingerprintCode(categories, coverage);

  return (
    <section className="analysis-fingerprint" aria-labelledby="fingerprint-title">
      <header>
        <div>
          <p className="mono-label">DETERMINISTIC RESULT SIGNATURE</p>
          <h3 id="fingerprint-title">Analysis fingerprint</h3>
          <p>A repeatable visual identifier derived only from returned category and coverage counts—not personality, quality, or hiring probability.</p>
        </div>
        <code aria-label={`Analysis fingerprint ${code}`}>{code}</code>
      </header>

      <div className="fingerprint-layout">
        <div className="fingerprint-mark" role="img" aria-label={`Deterministic analysis fingerprint ${code}`}>
          <span className="fingerprint-axis" aria-hidden="true" />
          {visibleCategories.map((category, index) => {
            const requested = category.total / maxTotal;
            const represented = category.total ? category.matched / category.total : 0;
            return (
              <span
                className="fingerprint-orbit"
                key={category.category}
                style={{
                  "--fingerprint-index": index,
                  "--fingerprint-count": visibleCategories.length,
                  "--fingerprint-requested": requested,
                  "--fingerprint-represented": represented,
                } as CSSProperties}
                aria-hidden="true"
              >
                <span />
              </span>
            );
          })}
          <span className="fingerprint-core" aria-hidden="true">RKS</span>
        </div>

        <div className="blueprint-profile">
          <div className="blueprint-heading">
            <strong>Résumé / role blueprint</strong>
            <span><i data-signal="represented" /> represented <i data-signal="requested" /> requested</span>
          </div>
          {visibleCategories.length ? (
            <dl>
              {visibleCategories.map((category) => (
                <div key={category.category}>
                  <dt>{category.category}</dt>
                  <dd>
                    <span className="blueprint-track" aria-hidden="true">
                      <i data-signal="requested" style={{ width: `${(category.total / maxTotal) * 100}%` }} />
                      <i data-signal="represented" style={{ width: `${(category.matched / maxTotal) * 100}%` }} />
                    </span>
                    <span>{category.matched} represented / {category.total} requested</span>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="empty-copy">No applicable category concepts were returned for this analysis.</p>
          )}
        </div>
      </div>
    </section>
  );
}
