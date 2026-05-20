import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

const sharedPreviewImage = {
  url: "/icon-512.jpg",
  width: 512,
  height: 512,
  alt: "DECODE app icon",
  type: "image/jpeg",
} as const;

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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg" }],
  },
  openGraph: {
    title: "Decode | Professional QR Platform",
    description:
      "Create and scan QR codes, verify links, decode content, and manage dynamic QR workflows.",
    url: appUrl,
    siteName: "DECODE",
    images: [sharedPreviewImage],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Decode | Professional QR Platform",
    description:
      "Create and scan QR codes, verify links, decode content, and manage dynamic QR workflows.",
    images: [sharedPreviewImage],
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
  themeColor: "#007AFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-512.jpg" />
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
