"use client";

import { Sparkles } from "lucide-react";

import {
  PREMIUM_INTEREST_PATH,
  PREMIUM_INTEREST_PRICE_USD,
  premiumInterestExperimentEnabled,
} from "@/lib/revenue-experiment";

export function PremiumInterestCta() {
  if (!premiumInterestExperimentEnabled()) return null;

  return (
    <aside className="premium-interest-card" aria-labelledby="premium-interest-title">
      <div>
        <p className="mono-label">OPTIONAL PRODUCT RESEARCH</p>
        <h3 id="premium-interest-title">Would a premium human-style review be worth $9?</h3>
        <p>
          The current lexical analysis stays free. This button records only an anonymous
          page view so we can measure interest before building or charging for anything.
        </p>
      </div>
      <a className="button button-primary" href={PREMIUM_INTEREST_PATH}>
        <Sparkles size={16} aria-hidden="true" />
        I&apos;d pay ${PREMIUM_INTEREST_PRICE_USD}
      </a>
    </aside>
  );
}
