"use client";

import { PuntoVenta } from "@/components/ventas/PuntoVenta";
import { RequiereSesion } from "@/components/RequiereSesion";

export default function PedidosPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
      <header className="mb-6 flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
          Mesero
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Pedidos
        </h1>
        <p className="text-sm leading-6 text-muted">
          Arma el pedido y cobra. Al cobrar se actualiza inventario y la venta
          queda registrada.
        </p>
      </header>
      <RequiereSesion>
        {(session) => (
          <PuntoVenta key={session.access_token} session={session} />
        )}
      </RequiereSesion>
    </main>
  );
}