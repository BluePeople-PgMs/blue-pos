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
      if (!data.session) {
        router.replace("/login");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
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
    return (
      <section
        role="status"
        className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
      >
        Revisando sesión…
      </section>
    );
  }

  return <>{children(session)}</>;
}
