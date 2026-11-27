"use client";

import Link from "next/link";
import { useState } from "react";
import {
  guardarCarrito,
  leerCarrito,
  resumenCarrito,
} from "@/lib/delivery-storage";
import { productoPorId } from "@/lib/delivery-mock";
import type { LineaCarrito } from "@/lib/delivery-mock";

export default function DeliveryCarritoPage() {
  const [lineas, setLineas] = useState<LineaCarrito[]>(() => leerCarrito());

  function actualizar(nuevas: LineaCarrito[]) {
    setLineas(nuevas);
    guardarCarrito(nuevas);
  }

  function quitar(productoId: string) {
    actualizar(lineas.filter((l) => l.productoId !== productoId));
  }

  function cambiarCantidad(productoId: string, delta: number) {
    actualizar(
      lineas
        .map((l) =>
          l.productoId === productoId
            ? { ...l, cantidad: Math.max(0, l.cantidad + delta) }
            : l,
        )
        .filter((l) => l.cantidad > 0),
    );
  }

  const total = resumenCarrito().total;

  return (
    <main className="flex flex-col gap-4 px-4">
      <h1 className="text-xl font-bold">Tu pedido</h1>
      {lineas.length === 0 ? (
        <p className="text-sm text-[var(--delivery-muted)]">
          El carrito está vacío.{" "}
          <Link href="/delivery" className="text-[var(--delivery-green)]">
            Ver menú
          </Link>
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lineas.map((fila) => {
            const producto = productoPorId(fila.productoId);
            if (!producto) return null;
            return (
              <li
                key={fila.productoId}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--delivery-card)] p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{producto.nombre}</p>
                  <p className="text-sm text-[var(--delivery-muted)]">
                    ${producto.precio.toFixed(0)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full bg-[var(--delivery-line)]"
                    onClick={() => cambiarCantidad(fila.productoId, -1)}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold">
                    {fila.cantidad}
                  </span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full bg-[var(--delivery-line)]"
                    onClick={() => cambiarCantidad(fila.productoId, 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => quitar(fila.productoId)}
                >
                  Quitar
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {lineas.length > 0 ? (
        <div className="mt-auto flex flex-col gap-3">
          <p className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${total.toFixed(0)}</span>
          </p>
          <Link
            href="/delivery/checkout"
            className="delivery-btn-primary rounded-full py-3.5 text-center text-sm font-bold"
          >
            Continuar pedido
          </Link>
        </div>
      ) : null}
    </main>
  );
}