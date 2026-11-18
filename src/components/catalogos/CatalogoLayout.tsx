"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  titulo: string;
  descripcion: string;
  error: string | null;
  mensaje: string | null;
  children: ReactNode;
};

export function CatalogoLayout({
  titulo,
  descripcion,
  error,
  mensaje,
  children,
}: Props) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
            Catálogos
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{titulo}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {descripcion}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href="/catalogos"
            className="rounded-lg border border-line bg-card px-3 py-2 font-medium hover:bg-background"
          >
            Hub de catálogos
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-line bg-card px-3 py-2 font-medium hover:bg-background"
          >
            Inicio
          </Link>
        </div>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-2xl border border-danger/30 bg-danger-soft px-5 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}
      {mensaje ? (
        <p
          role="status"
          className="rounded-2xl border border-accent/30 bg-accent-soft px-5 py-3 text-sm text-accent"
        >
          {mensaje}
        </p>
      ) : null}

      {children}
    </main>
  );
}

export const inputClassName =
  "rounded-lg border border-line bg-background px-3 py-2 text-sm";