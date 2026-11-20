import Link from "next/link";
import { InventarioVista } from "@/components/inventario/InventarioVista";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Inventario · Blue POS 2.0",
};

export default function InventarioPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
              Inventario
            </p>
            <Link href="/" className="text-sm font-medium text-muted">
              Inicio
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Entradas</h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Los productos salen del catálogo de la trattoria: comidas
            preparadas y productos empacados. Una entrada suma existencia. Las
            salidas llegan cuando se cobra una venta.
          </p>
        </header>
        <InventarioVista />
      </main>
    </RequiereSesion>
  );
}
