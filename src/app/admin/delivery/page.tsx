"use client";

import { RequiereSesion } from "@/components/RequiereSesion";

export default function AdminDeliveryPage() {
  return (
    <main className="app-main">
      <RequiereSesion>
        {() => (
          <section className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Delivery — operación
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Tablero de empaque, checklist e histórico (pendiente de migración{" "}
              <code className="font-mono text-xs">delivery_orders</code> y RPC).
            </p>
          </section>
        )}
      </RequiereSesion>
    </main>
  );
}