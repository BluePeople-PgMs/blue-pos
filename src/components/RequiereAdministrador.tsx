"use client";

import Link from "next/link";
import { useRol } from "@/components/contexto/RolContext";
import type { ReactNode } from "react";

export function RequiereAdministrador({ children }: { children: ReactNode }) {
  const { estado, esAdministrador, etiqueta } = useRol();

  if (estado === "cargando") {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
        <p className="text-sm text-muted" role="status">
          Comprobando permisos…
        </p>
      </main>
    );
  }

  if (!esAdministrador) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-12">
        <section className="rounded-2xl border border-line bg-card px-5 py-5">
          <h1 className="text-lg font-semibold">Solo administración</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Entraste como <strong>{etiqueta}</strong>. Esta pantalla es para
            administradores (inventario, historial de pagos y cancelaciones).
            El cobro del día sigue en Ventas.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/ventas"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Ir a ventas
            </Link>
            <Link
              href="/"
              className="rounded-full border border-line px-4 py-2 text-sm font-medium"
            >
              Inicio
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return children;
}