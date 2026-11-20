"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { mensajeErrorAuth } from "@/lib/authErrores";
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

function IconEye({ className }: { className?: string }) {
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
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className }: { className?: string }) {
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
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
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
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
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
        setError(mensajeErrorAuth(signInError.message));
        setEnviando(false);
        return;
      }
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: correo,
        password,
      });

      if (signUpError) {
        setError(mensajeErrorAuth(signUpError.message));
        setEnviando(false);
        return;
      }

      if (!data.session) {
        setAviso("Cuenta creada. Iniciando sesión…");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: correo,
          password,
        });

        if (signInError) {
          setError(mensajeErrorAuth(signInError.message));
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

  function irALogin() {
    setModo("entrar");
    setError(null);
    setAviso(null);
  }

  return (
    <div className="relative w-full min-w-0 max-w-[22rem] sm:max-w-md">
      <div className="brand-card overflow-hidden">
        <header className="brand-login-shell px-6 py-4 text-center">
          <h1 className="text-lg font-semibold tracking-wide text-white sm:text-xl">
            {titulo}
          </h1>
        </header>

        <div className="px-5 pb-7 pt-6 sm:px-8 sm:pb-8">
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
                <IconLock className="pointer-events-none absolute left-0 top-2 text-muted" />
                <input
                  id="login-password"
                  type={mostrarContrasena ? "text" : "password"}
                  name="password"
                  autoComplete={
                    modo === "entrar" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="brand-field-line brand-field-line--toggle"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((v) => !v)}
                  className="absolute right-0 top-1.5 rounded-md p-1 text-muted transition-colors hover:bg-background hover:text-foreground"
                  aria-label={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={mostrarContrasena}
                  aria-controls="login-password"
                >
                  {mostrarContrasena ? (
                    <IconEyeOff className="shrink-0" />
                  ) : (
                    <IconEye className="shrink-0" />
                  )}
                </button>
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

            {modo === "entrar" ? (
              <div className="text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setModo("registrar");
                    setError(null);
                    setAviso(null);
                  }}
                  className="font-medium text-brand-navy hover:underline"
                >
                  Crear cuenta
                </button>
              </div>
            ) : null}

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
                  ? "Entrar"
                  : "Registrarse"}
            </button>

            {modo === "registrar" ? (
              <button
                type="button"
                onClick={irALogin}
                className="brand-btn-secondary w-full px-4 py-3 text-sm font-medium"
              >
                Volver al login
              </button>
            ) : null}
          </form>

          <p className="mt-6 text-center text-[11px] text-muted">
            Blue POS 2.0 · Supabase Auth
          </p>
        </div>
      </div>
    </div>
  );
}