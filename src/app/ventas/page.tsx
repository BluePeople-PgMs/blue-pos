import Link from "next/link";
import { VentasVista } from "@/components/ventas/VentasVista";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Ventas · Trattoria Blue",
};

export default function VentasPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
              Ventas
            </p>
            <Link href="/" className="text-sm font-medium text-muted">
              Inicio
            </Link>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Cobro de ticket
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Arma una venta abierta con productos del catálogo. Usa el filtro
            (Todas, Abiertas, Pagadas, Canceladas) sobre la lista. Al cobrar, el
            estado pasa a cobrada, se guarda el pago y el inventario sale con
            salida_venta.
          </p>
        </header>
        <VentasVista />
      </main>
    </RequiereSesion>
  );
}