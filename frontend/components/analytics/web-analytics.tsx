"use client";

import { Analytics } from "@vercel/analytics/next";

import { analyticsModeForEnvironment, filterAnalyticsEvent } from "./privacy";

export function WebAnalytics() {
  return (
    <Analytics
      beforeSend={filterAnalyticsEvent}
      debug={false}
      mode={analyticsModeForEnvironment(process.env.NODE_ENV)}
    />
  );
}
