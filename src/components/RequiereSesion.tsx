"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase";

type RequiereSesionProps = {
  children: (session: Session) => React.ReactNode;
};

export function RequiereSesion({ children }: RequiereSesionProps) {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [session, setSession] = useState<Session | null | undefined>(() =>
    supabase ? undefined : null,
  );
  const [resuelta, setResuelta] = useState(!supabase);

  useEffect(() => {
    if (!supabase) {
      router.replace("/login");
      return;
    }

    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) {
        return;
      }
      setSession(data.session);
      setResuelta(true);
      if (!data.session) {
        router.replace("/login");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setResuelta(true);
      if (!next) {
        router.replace("/login");
      }
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  if (!session) {
    if (!resuelta) {
      return (
        <section
          role="status"
          className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
        >
          Revisando sesión…
        </section>
      );
    }
    return null;
  }

  return <>{children(session)}</>;
}
