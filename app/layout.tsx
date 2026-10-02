import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import PwaProvider from "./components/pwa/PwaProvider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-body",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

// Hindi glyphs. Not preloaded: the browser fetches it only when Devanagari text is on screen.
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["500", "700"],
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "TVS Credit — Smart Lending Decision Hub",
  description: "AI-Powered Smart Lending for Rural India. Satellite analytics, alternative credit scoring, harvest-aligned EMIs, and GenAI loan assistance.",
  applicationName: "TVS Kisan",
  appleWebApp: { capable: true, title: "TVS Kisan", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#FFD152",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${spaceGrotesk.variable} ${spaceMono.variable} ${notoDevanagari.variable}`}>
      <body className="antialiased">
        <NextIntlClientProvider>
          <PwaProvider>{children}</PwaProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
