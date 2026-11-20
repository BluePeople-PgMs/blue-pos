import { RecetasEditor } from "@/components/RecetasEditor";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recetas · Blue POS 2.0",
};

export default function RecetasPage() {
  return (
    <main className="app-main app-main--narrow">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          Recetas
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Insumos del preparado
        </h1>
        <p className="text-sm leading-6 text-muted">
          Elige un producto con{" "}
          <span className="font-mono text-foreground">tipo = preparado</span> y
          define las filas en{" "}
          <span className="font-mono text-foreground">receta_insumos</span> con
          productos{" "}
          <span className="font-mono text-foreground">tipo = insumo</span>.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/catalogos?tipo=preparado"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Ver catálogo (preparados)
          </Link>
          <Link
            href="/catalogos?tipo=insumo"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Ver catálogo (insumos)
          </Link>
          <Link
            href="/catalogos"
            className="font-medium text-muted underline-offset-4 hover:underline"
          >
            Todos los productos
          </Link>
          <Link
            href="/"
            className="font-medium text-muted underline-offset-4 hover:underline"
          >
            Inicio
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-card px-6 py-6">
        <RecetasEditor />
      </section>
    </main>
  );
}