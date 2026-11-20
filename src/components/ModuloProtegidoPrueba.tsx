"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

type Props = {
  titulo: string;
  tabla: "existencias" | "ventas";
  descripcion: string;
};

export function ModuloProtegidoPrueba({ titulo, tabla, descripcion }: Props) {
  const supabase = getSupabaseBrowser();
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [estado, setEstado] = useState<"cargando" | "ok" | "error">("cargando");

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let activo = true;

    supabase
      .from(tabla)
      .select("id")
      .limit(1)
      .then(({ error }) => {
        if (!activo) {
          return;
        }
        if (error) {
          setEstado("error");
          setMensaje(error.message);
          return;
        }
        setEstado("ok");
        setMensaje(
          `Lectura de ${tabla} permitida con sesión iniciada (puede no haber filas aún).`,
        );
      });

    return () => {
      activo = false;
    };
  }, [supabase, tabla]);

  if (!supabase) {
    return (
      <p className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
        Sin cliente Supabase.
      </p>
    );
  }

  return (
    <main className="app-main">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {titulo}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">{descripcion}</p>
      </header>

      <section className="rounded-2xl border border-line bg-card px-5 py-5">
        <p className="text-sm font-medium text-muted uppercase tracking-wide">
          Por construir
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground">
          Esta pantalla es un placeholder del módulo. Solo es accesible con
          sesión; la base rechaza lecturas anónimas en tablas de inventario y
          ventas.
        </p>

        <div
          role="status"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            estado === "ok"
              ? "border-accent/30 bg-accent-soft text-accent"
              : estado === "error"
                ? "border-danger/30 bg-danger-soft text-danger"
                : "border-line bg-background text-muted"
          }`}
        >
          {estado === "cargando" ? "Probando lectura…" : mensaje}
        </div>
      </section>
    </main>
  );
}