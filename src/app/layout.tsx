import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { BarraSesion } from "@/components/BarraSesion";
import { GuardaPlataforma } from "@/components/GuardaPlataforma";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense
          fallback={
            <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
              <p
                role="status"
                className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
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
      </body>
    </html>
  );
}