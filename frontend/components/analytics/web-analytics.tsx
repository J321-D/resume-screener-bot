"use client";

import { Analytics } from "@vercel/analytics/next";
import { useEffect, useState } from "react";

import { analyticsModeForEnvironment, filterAnalyticsEvent } from "./privacy";

export function WebAnalytics() {
  const [mode, setMode] = useState<"development" | "production">("development");

  useEffect(() => {
    setMode(analyticsModeForEnvironment(process.env.NODE_ENV, window.location.origin));
  }, []);

  return (
    <Analytics
      beforeSend={filterAnalyticsEvent}
      debug={false}
      mode={mode}
    />
  );
}
