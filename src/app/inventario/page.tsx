"use client";

import { EntradasInventario } from "@/components/inventario/EntradasInventario";
import { RequiereSesion } from "@/components/RequiereSesion";

export default function InventarioPage() {
  return (
    <main className="app-main">
      <RequiereSesion>
        {(session) => <EntradasInventario session={session} />}
      </RequiereSesion>
    </main>
  );
}