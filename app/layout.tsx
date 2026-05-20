import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Decode | Professional QR Platform",
  description:
    "Create, scan, verify, decode, and manage QR codes through a professional light workspace.",
  keywords: [
    "QR Code",
    "Cipher",
    "Encryption",
    "Decryption",
    "Base64",
    "Caesar Cipher",
    "Morse Code",
  ],
  authors: [{ name: "DECODE Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Decode | Professional QR Platform",
    description:
      "Create and scan QR codes, verify links, decode content, and manage dynamic QR workflows.",
    url: appUrl,
    siteName: "DECODE",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DECODE - QR Code Generator & Cipher Tools",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Decode | Professional QR Platform",
    description:
      "Create and scan QR codes, verify links, decode content, and manage dynamic QR workflows.",
    images: ["/og-image.png"],
  },
  metadataBase: new URL(appUrl),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DECODE",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/logo.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased"
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
