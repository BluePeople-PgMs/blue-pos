import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Acceso
        </h1>
        <p className="text-sm leading-6 text-muted">
          Entra para abrir la plataforma. Los módulos se ven después de iniciar
          sesión.
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