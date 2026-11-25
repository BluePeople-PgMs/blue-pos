"use client";

import { PuntoVenta } from "@/components/ventas/PuntoVenta";
import { RequiereSesion } from "@/components/RequiereSesion";

export default function PedidosPage() {
  return (
    <main className="app-main app-main--pos">
      <RequiereSesion>
        {(session) => (
          <PuntoVenta key={session.access_token} session={session} />
        )}
      </RequiereSesion>
    </main>
  );
}