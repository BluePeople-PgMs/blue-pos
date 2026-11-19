"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";

export function BarraSesion() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  const [session, setSession] = useState<Session | null | undefined>(
    supabase ? undefined : null,
  );
  const [cerrando, setCerrando] = useState(false);

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

  async function cerrarSesion() {
    if (!supabase) {
      return;
    }

    setCerrando(true);
    await supabase.auth.signOut();
    setCerrando(false);
    router.replace("/login");
  }

  if (!supabase || !session) {
    return null;
  }

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href="/" className="text-sm font-semibold text-foreground">
          Blue POS 2.0
        </Link>

        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/catalogos"
            className="font-medium text-accent hover:underline"
          >
            Catálogos
          </Link>
          <Link
            href="/inventario"
            className="font-medium text-accent hover:underline"
          >
            Inventario
          </Link>
          <Link
            href="/ventas"
            className="font-medium text-accent hover:underline"
          >
            Ventas
          </Link>
          <span className="text-muted">
            Sesión:{" "}
            <span className="font-medium text-foreground">
              {session.user.email ?? session.user.id}
            </span>
          </span>
          <button
            type="button"
            onClick={cerrarSesion}
            disabled={cerrando}
            className="rounded-lg border border-line px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-background disabled:opacity-60"
          >
            {cerrando ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </nav>
      </div>
    </header>
  );
}