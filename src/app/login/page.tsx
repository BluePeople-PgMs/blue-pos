import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-sm font-medium text-muted hover:text-foreground"
        >
          ← Volver al inicio
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Acceso
        </h1>
        <p className="text-sm leading-6 text-muted">
          Primera tarea del equipo: login con Supabase Auth. Inventario y ventas
          solo se usan con sesión iniciada.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-card px-5 py-6">
        <Suspense
          fallback={
            <p className="text-sm text-muted" role="status">
              Cargando formulario…
            </p>
          }
        >
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}