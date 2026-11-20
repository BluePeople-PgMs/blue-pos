import { BrandCanvas } from "@/components/branding/BrandCanvas";
import { LoginForm } from "@/components/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <BrandCanvas center>
      <Suspense
        fallback={
          <p className="text-sm text-brand-navy" role="status">
            Cargando formulario…
          </p>
        }
      >
        <LoginForm />
      </Suspense>
    </BrandCanvas>
  );
}