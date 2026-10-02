export const PREMIUM_PRODUCT_ID = "RKS-PREMIUM-TAILORED-REPORT-V1";
export const PREMIUM_PRICE_USD = "9.00";

export interface PremiumCheckoutConfig {
  enabled: boolean;
  ready: boolean;
  url: string | null;
  reason:
    | "READY"
    | "DISABLED"
    | "FULFILLMENT_NOT_READY"
    | "PRODUCT_MISMATCH"
    | "PRICE_MISMATCH"
    | "INVALID_PAYPAL_URL";
}

const PAYPAL_LINK = /^https:\/\/www\.paypal\.com\/ncp\/payment\/(PLB-[A-Z0-9]+)$/;

export function premiumCheckoutConfig(env: Record<string, string | undefined> = process.env): PremiumCheckoutConfig {
  if (env.NEXT_PUBLIC_PREMIUM_CHECKOUT_ENABLED !== "1") {
    return { enabled: false, ready: false, url: null, reason: "DISABLED" };
  }
  if (env.NEXT_PUBLIC_PREMIUM_FULFILLMENT_READY !== "1") {
    return { enabled: true, ready: false, url: null, reason: "FULFILLMENT_NOT_READY" };
  }
  if (env.NEXT_PUBLIC_PREMIUM_CHECKOUT_PRODUCT_ID !== PREMIUM_PRODUCT_ID) {
    return { enabled: true, ready: false, url: null, reason: "PRODUCT_MISMATCH" };
  }
  if (env.NEXT_PUBLIC_PREMIUM_CHECKOUT_PRICE_USD !== PREMIUM_PRICE_USD) {
    return { enabled: true, ready: false, url: null, reason: "PRICE_MISMATCH" };
  }
  const url = env.NEXT_PUBLIC_PREMIUM_CHECKOUT_URL?.trim() ?? "";
  if (!PAYPAL_LINK.test(url)) {
    return { enabled: true, ready: false, url: null, reason: "INVALID_PAYPAL_URL" };
  }
  return { enabled: true, ready: true, url, reason: "READY" };
}

export function normalizeAnalysisCode(value: string | null | undefined): string | null {
  const code = String(value ?? "").trim().toUpperCase();
  return /^[0-9A-F]{16}$/.test(code) ? code : null;
}
