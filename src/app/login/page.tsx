import { Suspense } from "react";
import { FormularioLogin } from "@/components/FormularioLogin";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-12">
      <Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
        <FormularioLogin />
      </Suspense>
    </main>
  );
}