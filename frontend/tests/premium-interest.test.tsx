import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PremiumInterestCta } from "@/components/revenue/premium-interest-cta";
import {
  PREMIUM_INTEREST_PATH,
  PREMIUM_INTEREST_PRICE_USD,
  premiumInterestExperimentEnabled,
} from "@/lib/revenue-experiment";

const original = process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT;

afterEach(() => {
  if (original === undefined) {
    delete process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT;
  } else {
    process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT = original;
  }
});

describe("premium interest revenue experiment", () => {
  it("is disabled unless the exact public flag is 1", () => {
    expect(premiumInterestExperimentEnabled(undefined)).toBe(false);
    expect(premiumInterestExperimentEnabled("0")).toBe(false);
    expect(premiumInterestExperimentEnabled("true")).toBe(false);
    expect(premiumInterestExperimentEnabled("1")).toBe(true);
  });

  it("renders nothing by default", () => {
    delete process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT;
    const { container } = render(<PremiumInterestCta />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a transparent non-payment willingness-to-pay CTA only when enabled", () => {
    process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT = "1";
    render(<PremiumInterestCta />);
    expect(screen.getByRole("heading", { name: /premium tailored review/i })).toBeInTheDocument();
    const link = screen.getByRole("link", { name: `I'd pay $${PREMIUM_INTEREST_PRICE_USD}` });
    expect(link).toHaveAttribute("href", PREMIUM_INTEREST_PATH);
    expect(screen.getByText(/records only an anonymous page view/i)).toBeInTheDocument();
    expect(screen.getByText(/current lexical analysis stays free/i)).toBeInTheDocument();
  });
});
