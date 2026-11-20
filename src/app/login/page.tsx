import { LoginForm } from "@/components/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="login-scene">
      <div className="login-scene__backdrop" aria-hidden />
      <div className="login-scene__content">
        <Suspense
          fallback={
            <p className="text-sm text-muted" role="status">
              Cargando formulario…
            </p>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}