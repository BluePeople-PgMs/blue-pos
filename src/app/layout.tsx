import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BarraSesion } from "@/components/BarraSesion";
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
  title: "Blue POS 2.0",
  description:
    "Cascarón de un punto de venta híbrido. Varias computadoras comparten la misma base en Supabase.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BarraSesion />
        {children}
      </body>
    </html>
  );
}
