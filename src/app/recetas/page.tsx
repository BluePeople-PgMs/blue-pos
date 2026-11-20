import Link from "next/link";
import { RecetasVista } from "@/components/recetas/RecetasVista";
import { RequiereAdministrador } from "@/components/RequiereAdministrador";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Recetas · Trattoria Blue",
};

export default function RecetasPage() {
  return (
    <RequiereSesion>
      <RequiereAdministrador>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
              Recetas
            </p>
            <Link href="/" className="text-sm font-medium text-muted">
              Inicio
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Insumos por plato
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            Cada comida preparada del menú tiene su receta: cantidades por
            porción de los ingredientes que descuentas en cocina.
          </p>
        </header>
        <RecetasVista />
      </main>
      </RequiereAdministrador>
    </RequiereSesion>
  );
}