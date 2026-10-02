"use client";

import { ExternalLink, LockKeyhole } from "lucide-react";
import { useState } from "react";

import {
  PREMIUM_CHECKOUT_PRICE_USD,
  createPremiumAnalysisCode,
  premiumPaidCheckoutEnabled,
  validPremiumPayPalLink,
} from "@/lib/revenue-experiment";

interface PremiumCheckoutCtaProps {
  stale: boolean;
}

export function PremiumCheckoutCta({ stale }: PremiumCheckoutCtaProps) {
  const [analysisCode] = useState(() => createPremiumAnalysisCode());
  const paymentLink = validPremiumPayPalLink(process.env.NEXT_PUBLIC_PREMIUM_PAYPAL_LINK);

  if (!premiumPaidCheckoutEnabled() || !paymentLink || stale) return null;

  return (
    <aside className="premium-interest-card" aria-labelledby="premium-checkout-title">
      <div>
        <p className="mono-label">PREMIUM // LIVE CHECKOUT</p>
        <h3 id="premium-checkout-title">
          Get the premium tailored review for ${PREMIUM_CHECKOUT_PRICE_USD}
        </h3>
        <p>
          PayPal hosts the payment page. Enter the Analysis code below in PayPal&apos;s
          required Analysis code field so a completed payment can be matched to this review.
        </p>
        <p>
          <strong>Analysis code: <code>{analysisCode}</code></strong>
        </p>
        <p>
          The code is random and does not contain your résumé, job description, email, or name.
          Shipping is not requested. A click or PayPal return page is not proof of payment.
        </p>
      </div>
      <a
        className="button button-primary"
        href={paymentLink}
        target="_blank"
        rel="noopener noreferrer"
      >
        <LockKeyhole size={16} aria-hidden="true" />
        Pay ${PREMIUM_CHECKOUT_PRICE_USD} with PayPal
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    </aside>
  );
}
