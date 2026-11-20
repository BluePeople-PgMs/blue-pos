"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRol } from "@/components/contexto/RolContext";
import { rutaPermitida } from "@/lib/roles";
import type { ReactNode } from "react";

export function GuardiaRutaPorRol({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { estado, rol, etiqueta } = useRol();

  if (estado !== "listo") {
    return children;
  }

  if (rutaPermitida(rol, pathname)) {
    return children;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-12">
      <section className="rounded-2xl border border-warn/30 bg-warn-soft px-5 py-5 text-sm">
        <h1 className="text-base font-semibold text-warn">Acceso restringido</h1>
        <p className="mt-2 leading-6 text-warn/90">
          Tu rol es <strong>{etiqueta}</strong>. No tienes acceso a esta
          sección. Si necesitas inventario o reportes, pide a un administrador.
        </p>
        <Link
          href="/ventas"
          className="mt-3 inline-block rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Volver a cobrar
        </Link>
      </section>
    </main>
  );
}