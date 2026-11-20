import { ListaProductosCatalogo } from "@/components/catalogo/ListaProductosCatalogo";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Lista de productos · Blue POS 2.0",
};

export default function CatalogosListaPage() {
  return (
    <main className="app-main">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          Catálogos
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Productos
        </h1>
        <p className="text-sm leading-6 text-muted">
          Fuente compartida para inventario, ventas y combos.
        </p>
        <p className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/catalogos"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Hub de catálogos
          </Link>
          <Link
            href="/catalogos/productos"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            Administrar productos
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