"use client";

import { PuntoVenta } from "@/components/ventas/PuntoVenta";
import { RequiereSesion } from "@/components/RequiereSesion";

export default function VentasPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
      <RequiereSesion>
        {(session) => (
          <PuntoVenta key={session.access_token} session={session} />
        )}
      </RequiereSesion>
    </main>
  );
}