"use client";

import { RequiereSesion } from "@/components/RequiereSesion";

export default function DeliveryClientePage() {
  return (
    <main className="app-main">
      <RequiereSesion>
        {() => (
          <section className="mx-auto flex w-full max-w-lg flex-col gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Delivery</h1>
            <p className="text-sm leading-6 text-muted">
              Catálogo, carrito y seguimiento del pedido van en el siguiente
              sprint. Ya puedes registrarte como cliente y el login te trae aquí.
            </p>
          </section>
        )}
      </RequiereSesion>
    </main>
  );
}