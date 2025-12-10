import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { ThemeProvider } from "@/context/ThemeContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DECODE | QR Generator & Cipher Tools",
  description:
    "A powerful PWA for QR Code generation, text encryption, and decryption. Create stylish QR codes and encode/decode messages with multiple cipher algorithms.",
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
  manifest: "./manifest.json",
  icons: {
    icon: "./logo.png",
    apple: "./logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fffbf5" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="./logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 min-h-screen transition-colors duration-300`}
      >
        <ThemeProvider>
          {/* Desktop: Centered with max-width, Mobile: Full width */}
          <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto min-h-screen border-x border-neutral-800 relative pb-20">
            {children}
          </div>
          <NavBar />
          <PWAInstallPrompt />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
