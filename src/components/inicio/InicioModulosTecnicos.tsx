"use client";

import Link from "next/link";
import { useRol } from "@/components/contexto/RolContext";
import { modulos } from "@/lib/modulos";

export function InicioModulosTecnicos() {
  const { esAdministrador, estado } = useRol();

  if (estado !== "listo" || !esAdministrador) {
    return null;
  }

  return (
    <details className="group flex flex-col gap-4 rounded-2xl border border-line bg-card px-5 py-4 open:pb-5">
      <summary className="cursor-pointer list-none text-sm font-semibold text-muted [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          Módulos del proyecto (administración)
          <span className="text-xs font-normal group-open:hidden">
            (desplegar)
          </span>
        </span>
      </summary>
      <h2 className="sr-only">Módulos</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {modulos.map((modulo) => (
          <li
            key={modulo.nombre}
            className="rounded-2xl border border-line bg-background px-5 py-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold">{modulo.nombre}</h3>
              <span
                className={`shrink-0 text-xs font-medium tracking-wide uppercase ${
                  modulo.estado === "listo" ? "text-accent" : "text-muted"
                }`}
              >
                {modulo.estado === "listo" ? "Listo" : "Por construir"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">{modulo.resumen}</p>
            {modulo.enlaces ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {modulo.enlaces.map((enlace) => (
                  <Link
                    key={enlace.href}
                    href={enlace.href}
                    className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-white"
                  >
                    {enlace.etiqueta}
                  </Link>
                ))}
              </div>
            ) : null}
            <ul className="mt-4 flex flex-wrap gap-2">
              {modulo.tablas.map((tabla) => (
                <li
                  key={tabla}
                  className="rounded-md bg-card px-2 py-1 font-mono text-xs text-foreground"
                >
                  {tabla}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </details>
  );
}