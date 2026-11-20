"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogoPizza } from "@/components/LogoPizza";
import { MenuModulos } from "@/components/MenuModulos";
import {
  borrarSesionLocal,
  EVENTO_SESION,
  leerSesionLocal,
} from "@/lib/sesionLocal";
import { getSupabaseBrowser } from "@/lib/supabase";
import { useMontado } from "@/lib/useMontado";

export function BarraSesion() {
  const router = useRouter();
  const montado = useMontado();
  const [usuario, setUsuario] = useState<User | null>(null);
  const [sesionLocal, setSesionLocal] = useState<string | null>(null);

  useEffect(() => {
    const actualizarLocal = () => {
      setSesionLocal(leerSesionLocal()?.email ?? null);
    };
    actualizarLocal();
    window.addEventListener(EVENTO_SESION, actualizarLocal);

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      return () => window.removeEventListener(EVENTO_SESION, actualizarLocal);
    }

    void supabase.auth.getUser().then(({ data }) => {
      setUsuario(data.user);
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

  const sesionActiva =
    montado && Boolean(usuario || sesionLocal);
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

  return (
    <header className="border-b border-line bg-card/90">
      <div
        aria-hidden="true"
        className="h-1.5 bg-[linear-gradient(90deg,#3d6b45_0_33%,#f4efe6_33%_66%,#7a1f24_66%_100%)]"
      />
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoPizza className="size-9 shrink-0" />
          <span className="flex flex-col">
          <span className="font-display text-[1.7rem] leading-none font-semibold tracking-tight text-foreground">
            Trattoria Blue
          </span>
          <span className="mt-1 text-[0.68rem] font-medium tracking-[0.18em] text-muted uppercase">
            Punto de venta
          </span>
          </span>
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