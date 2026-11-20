import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { BrandBackdrop } from "@/components/branding/BrandBackdrop";
import { BarraSesion } from "@/components/BarraSesion";
import { GuardaPlataforma } from "@/components/GuardaPlataforma";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <BrandBackdrop />
        <div className="brand-app flex min-h-full flex-col">
          <Suspense
            fallback={
              <main className="app-main">
                <p
                  role="status"
                  className="brand-surface rounded-2xl px-5 py-4 text-sm text-muted"
                >
                  Revisando sesión…
                </p>
              </main>
            }
          >
            <GuardaPlataforma>
              <BarraSesion />
              {children}
            </GuardaPlataforma>
          </Suspense>
        </div>
      </body>
    </html>
  );
}