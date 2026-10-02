import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/shell/footer";
import { Navigation } from "@/components/shell/navigation";
import {
  PREMIUM_CHECKOUT_PRICE_USD,
  premiumPaidCheckoutEnabled,
} from "@/lib/revenue-experiment";

export const metadata: Metadata = {
  title: "Premium payment return · Resume Keyword Screener",
  description: "Return page for the optional premium tailored review checkout.",
  robots: { index: false, follow: false },
};

export default function PremiumReturnPage() {
  if (!premiumPaidCheckoutEnabled()) notFound();

  return (
    <>
      <Navigation />
      <main id="main-content">
        <article className="prose-page shell premium-interest-page">
          <p className="eyebrow">Premium review</p>
          <h1>Return to your original analysis tab.</h1>
          <p>
            Returning from PayPal does <strong>not</strong> prove that a ${PREMIUM_CHECKOUT_PRICE_USD}
            payment completed. Keep the Analysis code you entered in PayPal.
          </p>
          <p>
            The premium report is released only after the payment provider confirms the exact
            live ${PREMIUM_CHECKOUT_PRICE_USD} product and the Analysis code is matched. Test,
            pending, canceled, wrong-price, or unrelated payments do not qualify.
          </p>
          <p>
            Your résumé and job-description text are not sent to PayPal by this handoff.
          </p>
          <Link className="button button-primary" href="/">
            Return to the screener
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
