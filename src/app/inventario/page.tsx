import Link from "next/link";
import { InventarioVista } from "@/components/inventario/InventarioVista";
import { RequiereAdministrador } from "@/components/RequiereAdministrador";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Inventario · Blue POS 2.0",
};

export default function InventarioPage() {
  return (
    <RequiereSesion>
      <RequiereAdministrador>
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
            Aquí controlas insumos de cocina (desde las recetas) y productos
            empacados de mostrador. Una entrada suma existencia; al cobrar una
            venta de terminados se descuenta el empacado vendido.
          </p>
        </header>
        <InventarioVista />
      </main>
      </RequiereAdministrador>
    </RequiereSesion>
  );
}
