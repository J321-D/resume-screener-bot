import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PremiumCheckoutCta } from "@/components/revenue/premium-checkout-cta";
import {
  PREMIUM_PRODUCT_ID,
  normalizeAnalysisCode,
  premiumCheckoutConfig,
} from "@/lib/premium-checkout";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

const readyEnv = {
  NEXT_PUBLIC_PREMIUM_CHECKOUT_ENABLED: "1",
  NEXT_PUBLIC_PREMIUM_FULFILLMENT_READY: "1",
  NEXT_PUBLIC_PREMIUM_CHECKOUT_PRODUCT_ID: PREMIUM_PRODUCT_ID,
  NEXT_PUBLIC_PREMIUM_CHECKOUT_PRICE_USD: "9.00",
  NEXT_PUBLIC_PREMIUM_CHECKOUT_URL: "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ",
};

describe("premium checkout gate", () => {
  it("is disabled by default", () => {
    expect(premiumCheckoutConfig({}).reason).toBe("DISABLED");
    render(<PremiumCheckoutCta analysisCode="0123456789ABCDEF" />);
    expect(screen.queryByText(/Premium tailored resume review/)).not.toBeInTheDocument();
  });

  it("fails closed on every incomplete or mismatched production gate", () => {
    expect(premiumCheckoutConfig({
      ...readyEnv,
      NEXT_PUBLIC_PREMIUM_FULFILLMENT_READY: "0",
    }).reason).toBe("FULFILLMENT_NOT_READY");
    expect(premiumCheckoutConfig({
      ...readyEnv,
      NEXT_PUBLIC_PREMIUM_CHECKOUT_PRODUCT_ID: "OTHER",
    }).reason).toBe("PRODUCT_MISMATCH");
    expect(premiumCheckoutConfig({
      ...readyEnv,
      NEXT_PUBLIC_PREMIUM_CHECKOUT_PRICE_USD: "9",
    }).reason).toBe("PRICE_MISMATCH");
    expect(premiumCheckoutConfig({
      ...readyEnv,
      NEXT_PUBLIC_PREMIUM_CHECKOUT_URL: "https://evil.example/ncp/payment/PLB-ABC123XYZ",
    }).reason).toBe("INVALID_PAYPAL_URL");
    expect(premiumCheckoutConfig({
      ...readyEnv,
      NEXT_PUBLIC_PREMIUM_CHECKOUT_URL: "https://www.paypal.com/ncp/payment/PLB-ABC123XYZ?x=1",
    }).reason).toBe("INVALID_PAYPAL_URL");
  });

  it("renders the exact hosted $9 handoff only when all gates agree", () => {
    for (const [key, value] of Object.entries(readyEnv)) vi.stubEnv(key, value);

    render(<PremiumCheckoutCta analysisCode="0123456789abcdef" />);

    expect(screen.getByText("Premium tailored resume review · $9")).toBeInTheDocument();
    expect(screen.getByText("0123456789ABCDEF")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Continue to secure PayPal checkout/ });
    expect(link).toHaveAttribute("href", readyEnv.NEXT_PUBLIC_PREMIUM_CHECKOUT_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText(/$9.00 USD · one time · hosted by PayPal/)).toBeInTheDocument();
    expect(screen.getByText(/provider-verified completed-payment evidence/)).toBeInTheDocument();
  });

  it("never renders without a current 16-hex analysis code", () => {
    for (const [key, value] of Object.entries(readyEnv)) vi.stubEnv(key, value);

    const { rerender } = render(<PremiumCheckoutCta analysisCode={null} />);
    expect(screen.queryByRole("link", { name: /PayPal checkout/ })).not.toBeInTheDocument();

    rerender(<PremiumCheckoutCta analysisCode="lab-run-1" />);
    expect(screen.queryByRole("link", { name: /PayPal checkout/ })).not.toBeInTheDocument();
  });

  it("normalizes only the opaque 16-hex input signature", () => {
    expect(normalizeAnalysisCode("0123456789abcdef")).toBe("0123456789ABCDEF");
    expect(normalizeAnalysisCode("01234567")).toBeNull();
    expect(normalizeAnalysisCode("0123456789ABCDEG")).toBeNull();
  });
});
