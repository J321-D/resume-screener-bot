import { afterEach, describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import nextConfig from "../next.config";

const originalVercelEnvironment = process.env.VERCEL_ENV;

afterEach(() => {
  if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnvironment;
});

describe("public web security and indexing contracts", () => {
  it("publishes only real canonical public routes in the sitemap", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([
      "https://resume-keyword-screener.vercel.app/",
      "https://resume-keyword-screener.vercel.app/methodology",
      "https://resume-keyword-screener.vercel.app/privacy",
      "https://resume-keyword-screener.vercel.app/help",
    ]);
  });

  it("keeps production indexable with the permanent canonical host", () => {
    process.env.VERCEL_ENV = "production";
    expect(robots()).toEqual(expect.objectContaining({
      rules: { userAgent: "*", allow: "/" },
      host: "https://resume-keyword-screener.vercel.app",
    }));
  });

  it("disallows indexing when built as a Preview deployment", () => {
    process.env.VERCEL_ENV = "preview";
    expect(robots()).toEqual(expect.objectContaining({
      rules: { userAgent: "*", disallow: "/" },
      sitemap: undefined,
    }));
  });

  it("sets a least-capability browser header baseline", async () => {
    const rules = await nextConfig.headers?.();
    const headers = Object.fromEntries((rules?.[0]?.headers ?? []).map(({ key, value }) => [key, value]));
    expect(headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    });
  });
});
