import type { Metadata } from "next";
import { Fredoka, Inter } from "next/font/google";
import type { Viewport } from "next";
import "@repo/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: "600",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-visual",
};

export const metadata: Metadata = {
  title: "Animi Boards",
  description: "Make anime/character boards with ease!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-primary">{children}</body>
    </html>
  );
}
