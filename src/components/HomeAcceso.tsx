"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";

export function HomeAcceso() {
  const supabase = getSupabaseBrowser();
  const [session, setSession] = useState<Session | null | undefined>(
    supabase ? undefined : null,
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let activo = true;

    supabase.auth.getSession().then(({ data: { session: actual } }) => {
      if (activo) {
        setSession(actual);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, actual) => {
      setSession(actual);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (session === undefined) {
    return null;
  }

  if (!session) {
    return (
      <section className="rounded-2xl border border-line bg-card px-5 py-5">
        <h2 className="text-lg font-semibold">Acceso al equipo</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          La primera tarea es el login. Inventario y ventas quedan bloqueados
          hasta iniciar sesión.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
        >
          Ir al login
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-accent/30 bg-accent-soft px-5 py-5">
      <h2 className="text-lg font-semibold text-accent">Sesión iniciada</h2>
      <p className="mt-2 text-sm leading-6 text-foreground">
        Ya puedes abrir inventario y ventas. Los catálogos siguen disponibles
        con o sin sesión.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/inventario"
          className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium text-foreground"
        >
          Inventario
        </Link>
        <Link
          href="/ventas"
          className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-medium text-foreground"
        >
          Ventas
        </Link>
      </div>
    </section>
  );
}