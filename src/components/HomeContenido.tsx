"use client";

import { usePerfilRol } from "@/context/PerfilRolContext";
import { EstadoConexion } from "@/components/EstadoConexion";
import { modulos, type Modulo } from "@/lib/modulos";
import {
  ROL_ADMINISTRADOR,
  ROL_MESERO,
  etiquetaRol,
  type RolPerfil,
} from "@/lib/roles";
import Link from "next/link";
import { Suspense } from "react";

function etiquetaModulo(modulo: Modulo) {
  if (modulo.nombre === "Inventario") {
    return "Abrir entradas de mercancía";
  }
  if (modulo.nombre === "Catálogos") {
    return "Abrir catálogos";
  }
  if (modulo.nombre === "Pedidos") {
    return "Abrir pedidos";
  }
  if (modulo.nombre === "Recetas") {
    return "Abrir recetas";
  }
  return "Abrir módulo";
}

function modulosVisibles(rol: RolPerfil) {
  return modulos.filter((m) => {
    if (m.deliveryOps) {
      return rol === ROL_MESERO || rol === ROL_ADMINISTRADOR;
    }
    if (m.soloMesero) {
      return rol === ROL_MESERO;
    }
    return rol === ROL_ADMINISTRADOR;
  });
}

export function HomeContenido() {
  const { rol, cargando } = usePerfilRol();

  if (cargando || !rol) {
    return (
      <main className="app-main">
        <p role="status" className="text-sm text-muted">
          Cargando inicio…
        </p>
      </main>
    );
  }

  const lista = modulosVisibles(rol);

  return (
    <main className="app-main">
      <header className="flex flex-col gap-3">
        <p className="brand-hero-eyebrow text-sm font-semibold tracking-[0.14em] uppercase">
          {etiquetaRol(rol)}
        </p>
        <h1 className="brand-hero-title text-4xl font-semibold tracking-tight sm:text-5xl">
          Blue POS 2.0
        </h1>
        <p className="brand-hero-muted max-w-2xl text-lg leading-8 text-muted">
          {rol === ROL_MESERO
            ? "Pantalla de pedidos y cobro rápido."
            : "Catálogos, inventario, combos y recetas. El punto de venta lo usan los meseros."}
        </p>
      </header>

      {rol === ROL_ADMINISTRADOR ? (
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
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Módulos</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {lista.map((modulo) => (
            <li key={modulo.nombre} className="cine-panel px-5 py-5">
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
                    className="cine-btn-primary inline-flex px-4 py-2 text-sm"
                  >
                    {etiquetaModulo(modulo)}
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