import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Source_Sans_3 } from "next/font/google";
import { AccesoLibre } from "@/components/AccesoLibre";
import { BarraSesion } from "@/components/BarraSesion";
import { RolProvider } from "@/components/contexto/RolContext";
import { GuardiaRutaPorRol } from "@/components/GuardiaRutaPorRol";
import { NavMovilPrototipo } from "@/components/navegacion/NavMovilPrototipo";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trattoria Blue",
  description:
    "Punto de venta de la trattoria. Comidas preparadas y productos empacados.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${sourceSans.variable} ${cormorant.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pb-20 md:pb-0">
        <RolProvider>
          <BarraSesion />
          <GuardiaRutaPorRol>
            <AccesoLibre>{children}</AccesoLibre>
          </GuardiaRutaPorRol>
          <NavMovilPrototipo />
        </RolProvider>
      </body>
    </html>
  );
}
