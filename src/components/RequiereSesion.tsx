"use client";

import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

type RequiereSesionProps = {
  children: (session: Session) => React.ReactNode;
};

export function RequiereSesion({ children }: RequiereSesionProps) {
  const supabase = getSupabaseBrowser();
  const [session, setSession] = useState<Session | null | undefined>(() =>
    supabase ? undefined : null,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

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
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const iniciarSesion = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!supabase) {
        return;
      }
      setEnviando(true);
      setError(null);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setEnviando(false);
      if (authError) {
        setError(authError.message);
      }
    },
    [email, password, supabase],
  );

  if (!supabase) {
    return (
      <section className="rounded-2xl border border-warn/30 bg-warn-soft px-5 py-4 text-warn">
        <p className="text-sm leading-6">
          Configura <code className="font-mono text-xs">.env.local</code> antes de
          usar inventario.
        </p>
      </section>
    );
  }

  if (session === undefined) {
    return (
      <section
        role="status"
        className="rounded-2xl border border-line bg-card px-5 py-4 text-sm text-muted"
      >
        Revisando sesión…
      </section>
    );
  }

  if (!session) {
    return (
      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <h2 className="text-lg font-semibold">Inicia sesión</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Las entradas de mercancía y las existencias solo se guardan con una
          cuenta autenticada.
        </p>
        <p className="mt-3 text-sm text-muted">
          También puedes{" "}
          <Link href="/login" className="font-medium text-accent underline">
            registrarte o iniciar sesión en la pantalla de acceso
          </Link>
          .
        </p>
        <form onSubmit={iniciarSesion} className="mt-5 flex max-w-md flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Correo</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Contraseña</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-line bg-background px-3 py-2"
            />
          </label>
          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={enviando}
            className="mt-1 w-fit rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </section>
    );
  }

  return <>{children(session)}</>;
}