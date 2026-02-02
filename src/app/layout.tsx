import "@/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Outfit, Space_Mono, DM_Mono, Instrument_Serif } from "next/font/google";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CrunchyReels - Anime Short-Form Video Investment",
  description:
    "CrunchyReels - Anime Short-Form Video Investment on Bitcoin L2. Support anime creators and own a piece of the content you love.",
  icons: [{ rel: "icon", url: "/icon.png" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CrunchyReels",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceMono.variable} ${dmMono.variable} ${instrumentSerif.variable} dark`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
