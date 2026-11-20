import Link from "next/link";
import { ReportesVista } from "@/components/reportes/ReportesVista";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Reportes · Trattoria Blue",
};

export default function ReportesPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
              Reportes
            </p>
            <Link href="/" className="text-sm font-medium text-muted">
              Inicio
            </Link>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Consultas por periodo
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Elige fechas y el tipo de reporte. Los datos salen de ventas,
            movimientos de inventario, cancelaciones y líneas vendidas (combos y
            platillos preparados).
          </p>
        </header>
        <ReportesVista />
      </main>
    </RequiereSesion>
  );
}