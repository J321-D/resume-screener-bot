import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PremiumCheckoutCta } from "@/components/revenue/premium-checkout-cta";
import { PremiumInterestCta } from "@/components/revenue/premium-interest-cta";
import {
  PREMIUM_CHECKOUT_PRICE_USD,
  PREMIUM_CHECKOUT_RETURN_PATH,
  createPremiumAnalysisCode,
  premiumPaidCheckoutEnabled,
  validPremiumPayPalLink,
} from "@/lib/revenue-experiment";

const originalPaid = process.env.NEXT_PUBLIC_PREMIUM_PAID_CHECKOUT_EXPERIMENT;
const originalLink = process.env.NEXT_PUBLIC_PREMIUM_PAYPAL_LINK;
const originalInterest = process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT;

afterEach(() => {
  if (originalPaid === undefined) delete process.env.NEXT_PUBLIC_PREMIUM_PAID_CHECKOUT_EXPERIMENT;
  else process.env.NEXT_PUBLIC_PREMIUM_PAID_CHECKOUT_EXPERIMENT = originalPaid;
  if (originalLink === undefined) delete process.env.NEXT_PUBLIC_PREMIUM_PAYPAL_LINK;
  else process.env.NEXT_PUBLIC_PREMIUM_PAYPAL_LINK = originalLink;
  if (originalInterest === undefined) delete process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT;
  else process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT = originalInterest;
});

describe("disabled-by-default premium checkout handoff", () => {
  it("accepts only exact hosted PayPal Payment Link URLs", () => {
    const exact = "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ";
    expect(validPremiumPayPalLink(exact)).toBe(exact);
    for (const unsafe of [
      "http://www.paypal.com/ncp/payment/PLB-ABC123XYZ",
      "https://evil.example/ncp/payment/PLB-ABC123XYZ",
      "https://www.paypal.com/ncp/buttons/create",
      "https://www.paypal.com/ncp/payment/plb-abc123xyz",
      "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ?analysis=secret",
      "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ#fragment",
    ]) {
      expect(validPremiumPayPalLink(unsafe)).toBeNull();
    }
  });

  it("requires both the exact paid flag and a valid PayPal link", () => {
    const exact = "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ";
    expect(premiumPaidCheckoutEnabled(undefined, exact)).toBe(false);
    expect(premiumPaidCheckoutEnabled("0", exact)).toBe(false);
    expect(premiumPaidCheckoutEnabled("1", "https://evil.example/checkout")).toBe(false);
    expect(premiumPaidCheckoutEnabled("1", exact)).toBe(true);
    expect(PREMIUM_CHECKOUT_RETURN_PATH).toBe("/premium-return");
  });

  it("builds a random-looking non-PII analysis code from exactly six bytes", () => {
    expect(createPremiumAnalysisCode(new Uint8Array([0, 1, 2, 3, 254, 255])))
      .toBe("RKS-00010203FEFF");
    expect(() => createPremiumAnalysisCode(new Uint8Array([1, 2]))).toThrow(/exactly 6 random bytes/i);
  });

  it("renders nothing unless explicitly enabled", () => {
    delete process.env.NEXT_PUBLIC_PREMIUM_PAID_CHECKOUT_EXPERIMENT;
    delete process.env.NEXT_PUBLIC_PREMIUM_PAYPAL_LINK;
    const { container } = render(<PremiumCheckoutCta stale={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the exact $9 hosted checkout without putting the analysis code in the URL", () => {
    process.env.NEXT_PUBLIC_PREMIUM_PAID_CHECKOUT_EXPERIMENT = "1";
    process.env.NEXT_PUBLIC_PREMIUM_PAYPAL_LINK = "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ";
    render(<PremiumCheckoutCta stale={false} />);

    expect(screen.getByRole("heading", { name: new RegExp(`premium tailored review for \\\$\${PREMIUM_CHECKOUT_PRICE_USD}`, "i") }))
      .toBeInTheDocument();
    const code = screen.getByText(/^RKS-[A-F0-9]{12}$/);
    const link = screen.getByRole("link", { name: new RegExp(`Pay \\\$\${PREMIUM_CHECKOUT_PRICE_USD} with PayPal`, "i") });
    expect(link).toHaveAttribute("href", "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ");
    expect(link.getAttribute("href")).not.toContain(code.textContent ?? "");
    expect(screen.getByText(/does not contain your résumé, job description, email, or name/i)).toBeInTheDocument();
    expect(screen.getByText(/return page is not proof of payment/i)).toBeInTheDocument();
  });

  it("hides checkout for stale results", () => {
    process.env.NEXT_PUBLIC_PREMIUM_PAID_CHECKOUT_EXPERIMENT = "1";
    process.env.NEXT_PUBLIC_PREMIUM_PAYPAL_LINK = "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ";
    const { container } = render(<PremiumCheckoutCta stale />);
    expect(container).toBeEmptyDOMElement();
  });

  it("suppresses the old demand-only CTA when paid checkout is enabled", () => {
    process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT = "1";
    process.env.NEXT_PUBLIC_PREMIUM_PAID_CHECKOUT_EXPERIMENT = "1";
    process.env.NEXT_PUBLIC_PREMIUM_PAYPAL_LINK = "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ";
    const { container } = render(<PremiumInterestCta />);
    expect(container).toBeEmptyDOMElement();
  });
});
