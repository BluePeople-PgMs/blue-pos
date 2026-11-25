"use client";

import { usePerfilRol } from "@/context/PerfilRolContext";
import { etiquetaRol, ROL_MESERO, rutaInicioPorRol } from "@/lib/roles";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function BarraSesion() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const { rol } = usePerfilRol();

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

  if (!supabase || !session || !rol) {
    return null;
  }

  const inicio = rutaInicioPorRol(rol);
  const enPedidos = pathname === "/pedidos";

  return (
    <header className={`brand-nav ${enPedidos ? "brand-nav--compact" : ""}`}>
      <div
        className={`mx-auto flex w-full flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
          enPedidos ? "max-w-none" : "max-w-[72rem]"
        }`}
      >
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link href={inicio} className="shrink-0 text-base font-semibold text-white">
            Blue POS 2.0
          </Link>
          <button
            type="button"
            onClick={cerrarSesion}
            disabled={cerrando}
            className="rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white sm:hidden"
          >
            {cerrando ? "…" : "Salir"}
          </button>
        </div>

        <nav
          className="brand-nav-scroll flex w-full min-w-0 items-center gap-3 overflow-x-auto pb-0.5 text-sm sm:w-auto sm:flex-wrap sm:overflow-visible"
          aria-label="Módulos"
        >
          {rol === ROL_MESERO ? (
            <Link href="/pedidos" className="font-medium">
              Pedidos
            </Link>
          ) : (
            <>
              <Link href="/catalogos" className="font-medium">
                Catálogos
              </Link>
              <Link href="/combos" className="font-medium">
                Combos
              </Link>
              <Link href="/recetas" className="font-medium">
                Recetas
              </Link>
              <Link href="/inventario" className="font-medium">
                Inventario
              </Link>
            </>
          )}
          <span className="hidden text-white/80 md:inline">
            <span className="sr-only">Sesión: </span>
            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-medium">
              {etiquetaRol(rol)}
            </span>{" "}
            ·{" "}
            <span className="max-w-[12rem] truncate font-medium text-white lg:max-w-xs">
              {session.user.email ?? session.user.id}
            </span>
          </span>
          <button
            type="button"
            onClick={cerrarSesion}
            disabled={cerrando}
            className="hidden rounded-md bg-white/15 px-3 py-1.5 font-semibold text-white transition-opacity hover:bg-white/25 disabled:opacity-60 sm:inline"
          >
            {cerrando ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </nav>
      </div>
    </header>
  );
}