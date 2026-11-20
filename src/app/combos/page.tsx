import { ComboDescuentoCarrusel } from "@/components/ComboDescuentoCarrusel";
import { CombosEditor } from "@/components/CombosEditor";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Combos · Blue POS 2.0",
};

export default function CombosPage() {
  return (
    <main className="app-main app-main--narrow">
      <ComboDescuentoCarrusel />

      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          Combos
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Componentes del combo
        </h1>
        <p className="text-sm leading-6 text-muted">
          Elige un producto con{" "}
          <span className="font-mono text-foreground">tipo = combo</span> y
          administra las filas en{" "}
          <span className="font-mono text-foreground">combo_componentes</span>.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/catalogos?tipo=combo"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Ver catálogo (combos)
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
        <CombosEditor />
      </section>
    </main>
  );
}