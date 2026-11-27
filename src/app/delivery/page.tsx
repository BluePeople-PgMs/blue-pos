"use client";

import { DeliveryClienteView } from "@/components/delivery/cliente/DeliveryClienteView";
import { RequiereSesion } from "@/components/RequiereSesion";

export default function DeliveryClientePage() {
  return (
    <main className="app-main app-main--narrow">
      <RequiereSesion>
        {(session) => (
          <DeliveryClienteView email={session.user.email ?? null} />
        )}
      </RequiereSesion>
    </main>
  );
}