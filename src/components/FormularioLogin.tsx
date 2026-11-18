"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { guardarSesionLocal } from "@/lib/sesionLocal";
import { getSupabaseBrowser } from "@/lib/supabase";

type Modo = "entrar" | "registro";

function destinoTrasLogin(siguiente: string | null) {
  if (siguiente?.startsWith("/") && !siguiente.startsWith("//")) {
    return siguiente;
  }
  return "/";
}

export function FormularioLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siguiente = searchParams.get("siguiente");
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensaje(null);
    setMensajeOk(false);

    setCargando(true);

    if (modo === "entrar") {
      const correo = email.trim();
      if (!correo) {
        setCargando(false);
        setMensaje("Escribe un correo para identificar la sesión.");
        return;
      }

      const supabase = getSupabaseBrowser();
      if (supabase && password) {
        void supabase.auth
          .signInWithPassword({ email: correo, password })
          .then(({ error }) => {
            if (error) {
              return supabase.auth.signUp({ email: correo, password });
            }
            return null;
          })
          .catch(() => null);
      }

      guardarSesionLocal(correo);
      setCargando(false);
      router.push(destinoTrasLogin(siguiente));
      router.refresh();
      return;
    }

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setCargando(false);
      setMensaje(
        "No hay cliente de Supabase. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local.",
      );
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setCargando(false);
    if (error) {
      setMensaje(error.message);
      return;
    }

    if (data.session) {
      setMensajeOk(true);
      setMensaje(
        "Cuenta creada. Ya tienes sesión; perfiles se actualiza solo con el trigger.",
      );
      router.push(destinoTrasLogin(siguiente));
      router.refresh();
      return;
    }

    setMensajeOk(false);
    setMensaje(
      "Cuenta creada, pero Supabase aún exige confirmar el correo antes de entrar. Desactívalo en Authentication → Providers → Email (Confirm email) o ejecuta npm run auth:sin-confirmacion con SUPABASE_ACCESS_TOKEN.",
    );
    setModo("entrar");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8">
      <header className="flex flex-col gap-2 text-center sm:text-left">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          Acceso
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm leading-6 text-muted">
          Supabase Auth guarda la cuenta. Al registrarte, la tabla{" "}
          <span className="font-mono text-foreground">perfiles</span> se llena
          sola.
        </p>
      </header>

      <div
        className="flex rounded-xl border border-line bg-card p-1"
        role="tablist"
        aria-label="Modo de acceso"
      >
        <button
          type="button"
          role="tab"
          aria-selected={modo === "entrar"}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            modo === "entrar"
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground"
          }`}
          onClick={() => {
            setModo("entrar");
            setMensaje(null);
            setMensajeOk(false);
          }}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === "registro"}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            modo === "registro"
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground"
          }`}
          onClick={() => {
            setModo("registro");
            setMensaje(null);
            setMensajeOk(false);
          }}
        >
          Crear cuenta
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-line bg-card px-6 py-6"
      >
        <label className="flex flex-col gap-2 text-sm font-medium">
          Correo
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-line bg-background px-4 py-2.5 font-normal text-foreground outline-none ring-accent focus:ring-2"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Contraseña
          <input
            type="password"
            name="password"
            autoComplete={
              modo === "entrar" ? "current-password" : "new-password"
            }
            required={modo === "registro"}
            minLength={modo === "registro" ? 6 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-line bg-background px-4 py-2.5 font-normal text-foreground outline-none ring-accent focus:ring-2"
          />
        </label>

        {mensaje ? (
          <p
            role="alert"
            className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
              mensajeOk
                ? "border-accent/30 bg-accent-soft text-accent"
                : "border-danger/30 bg-danger-soft text-danger"
            }`}
          >
            {mensaje}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={cargando}
          className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cargando
            ? "Espera…"
            : modo === "entrar"
              ? "Entrar"
              : "Registrarme"}
        </button>
      </form>

      <p className="text-center text-sm text-muted sm:text-left">
        <Link href="/" className="font-medium text-accent underline-offset-2 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}