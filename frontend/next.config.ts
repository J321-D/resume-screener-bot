import type { NextConfig } from "next";

const previewHeaders = process.env.VERCEL_ENV === "preview"
  ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
  : [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ...previewHeaders,
      ],
    }];
  },
};

export default nextConfig;
