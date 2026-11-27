"use client";

import { RepartidorDeliveryView } from "@/components/delivery/repartidor/RepartidorDeliveryView";
import { RequiereSesion } from "@/components/RequiereSesion";

export default function RepartidorDeliveryPage() {
  return (
    <main className="repartidor-main">
      <RequiereSesion>
        {(session) => (
          <RepartidorDeliveryView email={session.user.email ?? null} />
        )}
      </RequiereSesion>
    </main>
  );
}