import { Suspense } from "react";
import Link from "next/link";
import { EstadoConexion } from "@/components/EstadoConexion";
import { modulos } from "@/lib/modulos";

function etiquetaModulo(nombre: string) {
  if (nombre === "Inventario") {
    return "Abrir entradas de mercancía";
  }
  if (nombre === "Catálogos") {
    return "Abrir catálogos";
  }
  if (nombre === "Ventas") {
    return "Abrir punto de venta";
  }
  if (nombre === "Recetas") {
    return "Abrir recetas";
  }
  return "Abrir módulo";
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="brand-hero-eyebrow text-sm font-semibold tracking-[0.14em] uppercase">
          Punto de venta
        </p>
        <h1 className="brand-hero-title text-4xl font-semibold tracking-tight sm:text-5xl">
          Blue POS 2.0
        </h1>
        <p className="brand-hero-muted max-w-2xl text-lg leading-8 text-muted">
          Cascarón compartido para varias computadoras. Desde aquí se abren
          catálogos, entradas de inventario, ventas y cancelaciones.
        </p>
      </header>

      <Suspense
        fallback={
          <section
            role="status"
            className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
          >
            Revisando la conexión…
          </section>
        }
      >
        <EstadoConexion />
      </Suspense>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Módulos por construir</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {modulos.map((modulo) => (
            <li
              key={modulo.nombre}
              className="rounded-2xl border border-line bg-card px-5 py-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-lg font-semibold">{modulo.nombre}</h3>
                <span
                  className={`shrink-0 text-xs font-medium tracking-wide uppercase ${
                    modulo.listo ? "text-accent" : "text-muted"
                  }`}
                >
                  {modulo.listo ? "Listo" : "Por construir"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{modulo.resumen}</p>
              {modulo.ruta ? (
                <div className="mt-3">
                  <Link
                    href={modulo.ruta}
                    className="inline-flex rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white"
                  >
                    {etiquetaModulo(modulo.nombre)}
                  </Link>
                </div>
              ) : null}
              <ul className="mt-4 flex flex-wrap gap-2">
                {modulo.tablas.map((tabla) => (
                  <li
                    key={tabla}
                    className="rounded-md bg-background px-2 py-1 font-mono text-xs text-foreground"
                  >
                    {tabla}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}