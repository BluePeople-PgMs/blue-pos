"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";
import { destinoSeguro } from "@/lib/rutas-protegidas";

type GuardaPlataformaProps = {
  children: ReactNode;
};

export function GuardaPlataforma({ children }: GuardaPlataformaProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const enLogin = pathname === "/login";
  const next = destinoSeguro(searchParams.get("next"));

  const [session, setSession] = useState<Session | null | undefined>(
    supabase ? undefined : null,
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (activo) {
        setSession(data.session);
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

  useEffect(() => {
    if (session === undefined) {
      return;
    }

    if (!session && !enLogin) {
      const destino =
        pathname && pathname !== "/"
          ? `/login?next=${encodeURIComponent(pathname)}`
          : "/login";
      router.replace(destino);
      return;
    }

    if (session && enLogin) {
      router.replace(next ?? "/");
    }
  }, [enLogin, next, pathname, router, session]);

  const esperando =
    session === undefined || (!session && !enLogin) || Boolean(session && enLogin);

  return (
    <>
      {esperando ? (
        <main className="app-main">
          <p
            role="status"
            className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
          >
            Revisando sesión…
          </p>
        </main>
      ) : null}
      <div className={esperando ? "hidden" : "contents"}>{children}</div>
    </>
  );
}
