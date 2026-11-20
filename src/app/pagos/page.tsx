import Link from "next/link";
import { PagosVista } from "@/components/pagos/PagosVista";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Pagos · Blue POS 2.0",
};

export default function PagosPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
              Pagos
            </p>
            <Link href="/" className="text-sm font-medium text-muted">
              Inicio
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Cobro e historial
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Cobre ventas abiertas con efectivo, tarjeta o transferencia. Abajo
            verás los pagos ya registrados ligados al folio.
          </p>
        </header>
        <PagosVista />
      </main>
    </RequiereSesion>
  );
}