"use client";

import { DeliverySeguimientoView } from "@/components/delivery/cliente/DeliverySeguimientoView";
import { RequiereSesion } from "@/components/RequiereSesion";
import { useParams } from "next/navigation";

export default function DeliverySeguimientoPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  return (
    <main className="app-main app-main--narrow">
      <RequiereSesion>
        {(session) => (
          <DeliverySeguimientoView
            orderId={orderId}
            email={session.user.email ?? null}
          />
        )}
      </RequiereSesion>
    </main>
  );
}