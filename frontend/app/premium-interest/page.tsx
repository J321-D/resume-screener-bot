import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/shell/footer";
import { Navigation } from "@/components/shell/navigation";
import {
  PREMIUM_INTEREST_PRICE_USD,
  premiumInterestExperimentEnabled,
} from "@/lib/revenue-experiment";

export const metadata: Metadata = {
  title: "Premium interest · Resume Keyword Screener",
  description: "Anonymous product-interest validation for a possible premium résumé review.",
  robots: { index: false, follow: false },
};

export default function PremiumInterestPage() {
  if (!premiumInterestExperimentEnabled()) notFound();

  return (
    <>
      <Navigation />
      <main id="main-content">
        <article className="prose-page shell premium-interest-page">
          <p className="eyebrow">Product research</p>
          <h1>Thanks — your interest was recorded anonymously.</h1>
          <p>
            This page view is the signal. A ${PREMIUM_INTEREST_PRICE_USD} premium review
            is <strong>not for sale yet</strong>, no payment was requested or taken, and
            this page does not collect your email or résumé content.
          </p>
          <p>
            We are testing whether enough people actually want the offer before building
            billing or additional premium features.
          </p>
          <Link className="button button-primary" href="/">
            Return to the free screener
          </Link>
        </article>
      </main>
      <Footer />
    </>
  );
}
