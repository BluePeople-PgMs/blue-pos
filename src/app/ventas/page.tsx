"use client";

import { PuntoVenta } from "@/components/ventas/PuntoVenta";
import { RequiereSesion } from "@/components/RequiereSesion";

export default function VentasPage() {
  return (
    <main className="app-main">
      <RequiereSesion>
        {(session) => (
          <PuntoVenta key={session.access_token} session={session} />
        )}
      </RequiereSesion>
    </main>
  );
}