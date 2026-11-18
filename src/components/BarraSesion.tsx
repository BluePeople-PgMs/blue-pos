"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { MenuModulos } from "@/components/MenuModulos";
import {
  borrarSesionLocal,
  EVENTO_SESION,
  leerSesionLocal,
} from "@/lib/sesionLocal";
import { getSupabaseBrowser } from "@/lib/supabase";

export function BarraSesion() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [sesionLocal, setSesionLocal] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setSesionLocal(leerSesionLocal()?.email ?? null);

    const actualizarLocal = () => {
      setSesionLocal(leerSesionLocal()?.email ?? null);
    };
    window.addEventListener(EVENTO_SESION, actualizarLocal);

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setListo(true);
      return () => window.removeEventListener(EVENTO_SESION, actualizarLocal);
    }

    void supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
      setListo(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(EVENTO_SESION, actualizarLocal);
    };
  }, []);

  const sesionActiva = Boolean(usuario || sesionLocal);
  const etiquetaSesion = usuario?.email ?? usuario?.id ?? sesionLocal ?? "";

  async function cerrarSesion() {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      await supabase.auth.signOut();
    }
    borrarSesionLocal();
    setUsuario(null);
    setSesionLocal(null);
    router.push("/login");
    router.refresh();
  }

  if (!listo) {
    return null;
  }

  return (
    <header className="border-b border-line bg-card/80">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
        <Link href="/" className="font-semibold text-foreground">
          Blue POS 2.0
        </Link>
        <nav className="flex flex-wrap items-center gap-3">
          {sesionActiva ? (
            <>
              <span className="text-muted">
                Sesión:{" "}
                <span className="font-medium text-foreground">
                  {etiquetaSesion}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void cerrarSesion()}
                className="rounded-lg border border-line bg-background px-3 py-1.5 font-medium text-foreground hover:bg-accent-soft"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-accent px-3 py-1.5 font-semibold text-white hover:opacity-90"
            >
              Iniciar sesión
            </Link>
          )}
        </nav>
      </div>
      {sesionActiva ? <MenuModulos /> : null}
    </header>
  );
}