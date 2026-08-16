import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: "CarInspect AI — AI Car Pre-Purchase Inspection & Diagnostic PWA",
  description:
    "AI-powered mobile car pre-purchase inspection application combining Audio Spectrogram Transformer (AST) 19-class acoustic fault detection and Multimodal Vision-Language Models (VLM) for 20-point mechanical evaluation.",
  keywords: [
    "Car Pre-Purchase Inspection",
    "Automotive AI Diagnostic",
    "AST Audio Spectrogram Transformer",
    "Multimodal VLM Vehicle Inspection",
    "Rod Knock Detection",
    "Head Gasket Detection",
    "Used Car Scorecard",
  ],
  authors: [{ name: "CarInspect AI Team" }],
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
