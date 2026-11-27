"use client";

import { RequiereSesion } from "@/components/RequiereSesion";

export default function RepartidorDeliveryPage() {
  return (
    <main className="app-main">
      <RequiereSesion>
        {() => (
          <section className="mx-auto flex w-full max-w-lg flex-col gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Entregas</h1>
            <p className="text-sm leading-6 text-muted">
              Lista de pedidos listos para pickup y en camino. La bandeja y mapas
              se conectan cuando existan las tablas delivery en Supabase.
            </p>
          </section>
        )}
      </RequiereSesion>
    </main>
  );
}