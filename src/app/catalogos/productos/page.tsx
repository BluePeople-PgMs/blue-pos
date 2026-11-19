import { Suspense } from "react";
import { CatalogoVista } from "@/components/CatalogoVista";
import { leerCatalogo } from "@/lib/catalogo";

export const metadata = {
  title: "Productos terminados · Trattoria Blue",
};

export default function ProductosPage() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Productos terminados
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted">
          Productos empacados de mostrador. Incluye pasta seca, conservas,
          quesos, embutidos, pizzas congeladas, bases para pizza y despensa.
        </p>
      </header>
      <Suspense fallback={<Cargando />}>
        <Lista />
      </Suspense>
    </section>
  );
}

async function Lista() {
  const { error, productos } = await leerCatalogo("directo");
  if (error) {
    return <Aviso mensaje={error} />;
  }
  if (productos.length === 0) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
      >
        Todavía no hay productos terminados en el catálogo.
      </p>
    );
  }
  return <CatalogoVista productos={productos} />;
}

function Cargando() {
  return (
    <p
      role="status"
      className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
    >
      Cargando productos…
    </p>
  );
}

function Aviso({ mensaje }: { mensaje: string }) {
  return (
    <p
      role="status"
      className="rounded-2xl border border-danger/30 bg-danger-soft px-5 py-4 text-sm text-danger"
    >
      {mensaje}
    </p>
  );
}
