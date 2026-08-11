import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { WebAnalytics } from "@/components/analytics/web-analytics";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Resume Keyword Screener",
  description:
    "Private lexical résumé-to-job comparison with matched terms, coverage opportunities, and Unicode PDF reports.",
  metadataBase: new URL("https://resume-keyword-screener.vercel.app"),
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Resume Keyword Screener",
    description: "Map your résumé language to the role—privately and deterministically.",
    images: ["/social-preview.svg"],
    type: "website",
    url: "https://resume-keyword-screener.vercel.app",
  },
};

export const viewport: Viewport = { colorScheme: "dark", themeColor: "#070B14" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
        <WebAnalytics />
      </body>
    </html>
  );
}
