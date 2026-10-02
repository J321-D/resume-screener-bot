"use client";

import { ExternalLink, LockKeyhole } from "lucide-react";

import { normalizeAnalysisCode, premiumCheckoutConfig } from "@/lib/premium-checkout";

interface PremiumCheckoutCtaProps {
  analysisCode: string | null | undefined;
}

export function PremiumCheckoutCta({ analysisCode }: PremiumCheckoutCtaProps) {
  const config = premiumCheckoutConfig();
  const code = normalizeAnalysisCode(analysisCode);

  // Payment collection remains physically absent from the rendered page until
  // all four explicit production configuration gates agree.
  if (!config.ready || !config.url || !code) return null;

  return (
    <section className="premium-interest-card premium-checkout-cta" aria-labelledby="premium-checkout-title">
      <div>
        <p className="mono-label">ONE-TIME PREMIUM REVIEW</p>
        <h3 id="premium-checkout-title">Premium tailored resume review · $9</h3>
        <p>
          Continue to PayPal’s hosted checkout. PayPal will ask for the Analysis code below so the
          completed payment can be matched to this exact in-memory review without storing your résumé.
        </p>
        <div className="premium-analysis-code">
          <span>Analysis code</span>
          <code>{code}</code>
        </div>
        <p className="premium-checkout-note">
          Keep this results tab open. Payment is not inferred from a redirect or click; fulfillment
          requires provider-verified completed-payment evidence.
        </p>
      </div>
      <div>
        <a
          className="button button-primary"
          href={config.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <LockKeyhole size={16} aria-hidden="true" />
          Continue to secure PayPal checkout
          <ExternalLink size={15} aria-hidden="true" />
        </a>
        <small>$9.00 USD · one time · hosted by PayPal</small>
      </div>
    </section>
  );
}
