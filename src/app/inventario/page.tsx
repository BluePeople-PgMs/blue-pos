"use client";

import { EntradasInventario } from "@/components/inventario/EntradasInventario";
import { RequiereSesion } from "@/components/RequiereSesion";

export default function InventarioPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-12">
      <RequiereSesion>
        {(session) => <EntradasInventario session={session} />}
      </RequiereSesion>
    </main>
  );
}