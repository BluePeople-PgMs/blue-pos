import Link from "next/link";
import { CancelacionesVista } from "@/components/cancelaciones/CancelacionesVista";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Cancelaciones · Blue POS 2.0",
};

export default function CancelacionesPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
              Cancelaciones
            </p>
            <Link href="/" className="text-sm font-medium text-muted">
              Inicio
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Ventas canceladas
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Motivo y fecha de cada venta cobrada cancelada. El inventario se
            devuelve desde Ventas al cancelar.
          </p>
        </header>
        <CancelacionesVista />
      </main>
    </RequiereSesion>
  );
}