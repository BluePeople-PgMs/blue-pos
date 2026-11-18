"use client";

import { RequiereSesion } from "@/components/RequiereSesion";
import { ModuloProtegidoPrueba } from "@/components/ModuloProtegidoPrueba";

export default function VentasPage() {
  return (
    <RequiereSesion>
      {() => (
        <ModuloProtegidoPrueba
          titulo="Ventas"
          tabla="ventas"
          descripcion="Al cobrar, la venta es la salida de inventario. También se pueden cancelar."
        />
      )}
    </RequiereSesion>
  );
}