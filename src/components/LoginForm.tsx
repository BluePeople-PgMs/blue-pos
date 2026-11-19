"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { destinoSeguro } from "@/lib/rutas-protegidas";
import { MENSAJE_FALTAN_VARIABLES } from "@/lib/mensajes";

type Modo = "entrar" | "registrar";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = destinoSeguro(searchParams.get("next"));

  const supabase = getSupabaseBrowser();

  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let activo = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (activo && session) {
        router.replace(next ?? "/");
      }
    });

    return () => {
      activo = false;
    };
  }, [supabase, router, next]);

  if (!supabase) {
    return (
      <p className="rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 text-sm leading-6 text-warn">
        {MENSAJE_FALTAN_VARIABLES}
      </p>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      return;
    }

    setError(null);
    setAviso(null);

    const correo = email.trim();
    if (!correo || !password) {
      setError("Escribe correo y contraseña.");
      return;
    }

    setEnviando(true);

    if (modo === "entrar") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: correo,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setEnviando(false);
        return;
      }
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: correo,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setEnviando(false);
        return;
      }

      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: correo,
          password,
        });

        if (signInError) {
          setError(
            signInError.message === "Email not confirmed"
              ? "La cuenta se creó, pero este proyecto de Supabase exige confirmar el correo antes de iniciar sesión y no entrega esa sesión."
              : signInError.message,
          );
          setModo("entrar");
          setEnviando(false);
          return;
        }
      }
    }

    router.replace(next ?? "/");
    router.refresh();
    setEnviando(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 rounded-xl bg-background p-1">
        <button
          type="button"
          onClick={() => {
            setModo("entrar");
            setError(null);
            setAviso(null);
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            modo === "entrar"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setModo("registrar");
            setError(null);
            setAviso(null);
          }}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            modo === "registrar"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Correo</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-foreground">Contraseña</span>
          <input
            type="password"
            name="password"
            autoComplete={
              modo === "entrar" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-line bg-background px-3 py-2.5 text-foreground outline-none focus:border-accent"
          />
        </label>

        {modo === "registrar" ? (
          <p className="text-xs leading-5 text-muted">
            Al registrarte, Supabase crea el usuario y el cascarón inserta tu
            fila en{" "}
            <span className="font-mono text-foreground">perfiles</span> con el
            trigger.
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        {aviso ? (
          <p
            role="status"
            className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent"
          >
            {aviso}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {enviando
            ? "Espera…"
            : modo === "entrar"
              ? "Entrar"
              : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}