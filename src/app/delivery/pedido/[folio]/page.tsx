"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { DeliverySeguimiento } from "@/components/delivery/DeliverySeguimiento";

export default function DeliveryPedidoPage() {
  const params = useParams();
  const folio = typeof params.folio === "string" ? params.folio : "";

  return (
    <main className="flex flex-col gap-4 px-4 pb-4">
      <p className="text-xs text-[var(--delivery-muted)]">
        El restaurante ve el mismo pedido en{" "}
        <Link href="/delivery/cocina" className="underline">
          Cocina
        </Link>
        . En la demo usa dos pestañas: aquí el cliente, allí el staff.
      </p>
      <DeliverySeguimiento folio={folio} />
    </main>
  );
}