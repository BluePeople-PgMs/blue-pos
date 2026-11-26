import Link from "next/link";
import { Suspense } from "react";
import { VentasVista } from "@/components/ventas/VentasVista";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Ventas · Trattoria Blue",
};

export const instant = false;

export default function VentasPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-olive uppercase">
              Captura de pedidos
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Menú y cobro
            </h1>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Inicio
          </Link>
        </header>
        <Suspense
          fallback={
            <p className="text-sm text-muted">Preparando captura de pedidos…</p>
          }
        >
          <VentasVista />
        </Suspense>
      </main>
    </RequiereSesion>
  );
}