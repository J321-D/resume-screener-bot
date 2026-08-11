import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const preview = process.env.VERCEL_ENV === "preview";
  return {
    rules: preview
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
    sitemap: preview ? undefined : "https://resume-keyword-screener.vercel.app/sitemap.xml",
    host: "https://resume-keyword-screener.vercel.app",
  };
}
