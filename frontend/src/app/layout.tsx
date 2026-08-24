import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8f9fa",
};

export const metadata: Metadata = {
  title: "CarInspect AI — Vehicle Pre-Purchase Inspection",
  description:
    "Calm, focused AI-assisted vehicle pre-purchase inspection instrument combining Acoustic AST and Multimodal Vision AI.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} light`}>
      <body className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
