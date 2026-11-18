import { ListaProductosCatalogo } from "@/components/catalogo/ListaProductosCatalogo";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Catálogo · Blue POS 2.0",
};

export default function CatalogosPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          Catálogos
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Productos
        </h1>
        <p className="text-sm leading-6 text-muted">
          Fuente compartida para inventario, ventas y combos. Tabla{" "}
          <span className="font-mono text-foreground">productos</span>.
        </p>
        <p className="text-sm">
          <Link
            href="/"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Volver al inicio
          </Link>
        </p>
      </header>

      <Suspense
        fallback={
          <p className="text-sm text-muted" role="status">
            Cargando catálogo…
          </p>
        }
      >
        <ListaProductosCatalogo />
      </Suspense>
    </main>
  );
}