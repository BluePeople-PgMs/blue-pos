"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { destinoSeguro } from "@/lib/rutas-protegidas";
import { MENSAJE_FALTAN_VARIABLES } from "@/lib/mensajes";

type Modo = "entrar" | "registrar";

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = destinoSeguro(searchParams.get("next"));
  const rememberId = useId();

  const supabase = getSupabaseBrowser();

  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recordar, setRecordar] = useState(true);
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
              ? "Cuenta creada. Si el proyecto exige confirmar correo, revisa tu bandeja."
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

  const titulo = modo === "entrar" ? "Mi cuenta" : "Registro";

  return (
    <div className="relative w-full max-w-[22rem]">
      <div className="relative mx-auto w-full pt-20">
        <div
          className="brand-login-shell absolute left-0 right-0 top-0 h-[7.5rem] overflow-hidden rounded-t-lg"
          aria-hidden
        >
          <p className="px-6 pt-6 text-center text-lg font-semibold tracking-wide text-white">
            {titulo}
          </p>
        </div>

        <div
          className="absolute left-1/2 top-8 z-10 flex h-[5.5rem] w-[5.5rem] -translate-x-1/2 items-center justify-center rounded-full border-[5px] border-white bg-brand-navy shadow-lg"
          aria-hidden
        >
          <IconUser className="text-white/95" />
        </div>

        <div className="brand-card relative mt-0 px-8 pb-8 pt-24">
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="relative">
              <IconUser className="absolute left-0 top-2 text-muted" />
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="Correo / Login"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="brand-field-line"
              />
            </div>

            <div className="flex items-start gap-3">
              <div className="relative min-w-0 flex-1">
                <IconLock className="absolute left-0 top-2 text-muted" />
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete={
                    modo === "entrar" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="brand-field-line"
                />
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                <input
                  id={rememberId}
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="h-4 w-4 accent-[var(--brand-navy)]"
                />
                <label
                  htmlFor={rememberId}
                  className="text-[10px] leading-tight text-muted"
                >
                  Recordar
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setModo(modo === "entrar" ? "registrar" : "entrar");
                  setError(null);
                  setAviso(null);
                }}
                className="font-medium text-brand-navy hover:underline"
              >
                {modo === "entrar"
                  ? "Crear cuenta"
                  : "Ya tengo cuenta"}
              </button>
              <span className="text-muted">¿Olvidaste la contraseña?</span>
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-md bg-danger-soft px-3 py-2 text-xs text-danger"
              >
                {error}
              </p>
            ) : null}

            {aviso ? (
              <p
                role="status"
                className="rounded-md bg-accent-soft px-3 py-2 text-xs text-accent"
              >
                {aviso}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={enviando}
              className="brand-btn-primary w-full px-4 py-3.5 text-sm uppercase tracking-wider"
            >
              {enviando
                ? "Espera…"
                : modo === "entrar"
                  ? "Sign in"
                  : "Registrarse"}
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-muted">
            Blue POS 2.0 · Supabase Auth
          </p>
        </div>
      </div>
    </div>
  );
}