import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import Script from "next/script";
import {
  getWelcomeTitleBootstrapScript,
  PAGE_TITLE,
} from "@/lib/welcome-title";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const SITE_DESCRIPTION =
  "SylvaNova is a gaming community grove taking root. Something new is growing — check back soon.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: PAGE_TITLE,
    description: "A gaming community grove taking root.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <Script
          id="welcome-title-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: getWelcomeTitleBootstrapScript(),
          }}
        />
        {children}
      </body>
    </html>
  );
}
