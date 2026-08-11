import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { analyticsModeForEnvironment, filterAnalyticsEvent } from "@/components/analytics/privacy";
import { WebAnalytics } from "@/components/analytics/web-analytics";

const analyticsSpy = vi.fn<(props: unknown) => void>();

vi.mock("@vercel/analytics/next", () => ({
  Analytics: (props: unknown) => {
    analyticsSpy(props);
    return null;
  },
}));

describe("privacy-safe Web Analytics", () => {
  beforeEach(() => analyticsSpy.mockClear());

  it("uses the non-transmitting mode outside production", () => {
    expect(analyticsModeForEnvironment("development")).toBe("development");
    expect(analyticsModeForEnvironment("test")).toBe("development");
    expect(analyticsModeForEnvironment(undefined)).toBe("development");
    expect(analyticsModeForEnvironment("production")).toBe("production");

    render(<WebAnalytics />);
    expect(analyticsSpy).toHaveBeenCalledWith(expect.objectContaining({
      beforeSend: filterAnalyticsEvent,
      debug: false,
      mode: "development",
    }));
  });

  it.each(["/", "/methodology", "/privacy"])(
    "allows the public path %s while removing query and fragment data",
    (pathname) => {
      expect(filterAnalyticsEvent({
        type: "pageview",
        url: `https://resume-keyword-screener.vercel.app${pathname}?private=value#result`,
      })).toEqual({
        type: "pageview",
        url: `https://resume-keyword-screener.vercel.app${pathname}`,
      });
    },
  );

  it("rejects unapproved and malformed URLs", () => {
    expect(filterAnalyticsEvent({ type: "pageview", url: "/results" })).toBeNull();
    expect(filterAnalyticsEvent({ type: "pageview", url: "http://localhost:3000/" })).toBeNull();
    expect(filterAnalyticsEvent({ type: "pageview", url: "https://example.com/privacy" })).toBeNull();
    expect(filterAnalyticsEvent({ type: "pageview", url: "https://[invalid" })).toBeNull();
  });
});
