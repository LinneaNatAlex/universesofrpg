import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body
        className="min-h-full flex flex-col pb-16 md:pb-0 bg-background text-foreground"
        style={{ backgroundColor: "#0a0612", color: "#f0eaff" }}
      >
        {children}
      </body>
    </html>
  );
}
