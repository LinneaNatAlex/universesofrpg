import type { Metadata } from "next";
import { Bangers, Comic_Neue, Geist_Mono } from "next/font/google";
import { RootProviders } from "@/components/providers/RootProviders";
import "./globals.css";

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const bangers = Bangers({
  variable: "--font-bangers",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Universes of RPG — Social Hub for Roleplay Creators",
  description:
    "Create, share, and sell RPG characters, coded profiles, stories, and digital assets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${comicNeue.variable} ${bangers.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pb-16 md:pb-0 bg-background text-foreground">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
