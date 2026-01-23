import "@/styles/globals.css";

import { type Metadata } from "next";
import { Outfit, Space_Mono } from "next/font/google";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CineBlock - Tokenized Film Investment",
  description:
    "CineBlock - Tokenized Film Investment on Bitcoin L2. Own a piece of cinema through blockchain technology.",
  icons: [{ rel: "icon", url: "/icon.png" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CineBlock",
  },
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${spaceMono.variable} dark`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
