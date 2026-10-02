export const PREMIUM_INTEREST_PRICE_USD = 9;
export const PREMIUM_INTEREST_PATH = "/premium-interest";

export function premiumInterestExperimentEnabled(
  value = process.env.NEXT_PUBLIC_PREMIUM_INTEREST_EXPERIMENT,
): boolean {
  return value === "1";
}


export const PREMIUM_CHECKOUT_PRICE_USD = 9;
export const PREMIUM_CHECKOUT_RETURN_PATH = "/premium-return";
const PAYPAL_PAYMENT_LINK_PATH = /^\/ncp\/payment\/PLB-[A-Z0-9]+$/;

export function validPremiumPayPalLink(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:"
      || !["paypal.com", "www.paypal.com"].includes(host)
      || !PAYPAL_PAYMENT_LINK_PATH.test(url.pathname)
      || url.username
      || url.password
      || url.search
      || url.hash
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function premiumPaidCheckoutEnabled(
  flag = process.env.NEXT_PUBLIC_PREMIUM_PAID_CHECKOUT_EXPERIMENT,
  paymentLink = process.env.NEXT_PUBLIC_PREMIUM_PAYPAL_LINK,
): boolean {
  return flag === "1" && validPremiumPayPalLink(paymentLink) !== null;
}

export function createPremiumAnalysisCode(): string {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `RKS-${body}`;
}
