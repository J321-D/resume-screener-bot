import type { BeforeSendEvent } from "@vercel/analytics";

const ANALYTICS_PATHS = new Set(["/", "/methodology", "/privacy"]);
const ANALYTICS_ORIGIN = "https://resume-keyword-screener.vercel.app";

export function analyticsModeForEnvironment(
  environment: string | undefined,
): "development" | "production" {
  return environment === "production" ? "production" : "development";
}

export function filterAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const parsed = new URL(event.url);
    if (parsed.origin !== ANALYTICS_ORIGIN || !ANALYTICS_PATHS.has(parsed.pathname)) {
      return null;
    }

    return { ...event, url: `${ANALYTICS_ORIGIN}${parsed.pathname}` };
  } catch {
    return null;
  }
}
