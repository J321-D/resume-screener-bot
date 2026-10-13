import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://resume-keyword-screener.vercel.app";
  return ["/", "/methodology", "/privacy", "/help", "/examples/bioprocess-resume-review"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "/" ? "monthly" : "yearly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
