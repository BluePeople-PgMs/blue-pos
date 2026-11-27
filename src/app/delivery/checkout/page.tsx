"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmarPedidoDelivery } from "@/lib/delivery";
import { resumenCarrito } from "@/lib/delivery-storage";
import type { MetodoPagoDelivery } from "@/lib/delivery-mock";
import { getSupabaseBrowser } from "@/lib/supabase";

const METODOS: { id: MetodoPagoDelivery; titulo: string }[] = [
  { id: "efectivo", titulo: "Efectivo" },
  { id: "tarjeta", titulo: "Tarjeta" },
  { id: "transferencia", titulo: "Transferencia" },
];

export default function DeliveryCheckoutPage() {
  const router = useRouter();
  const { total } = resumenCarrito();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [metodo, setMetodo] = useState<MetodoPagoDelivery>("tarjeta");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const haySupabase = Boolean(getSupabaseBrowser());

  async function confirmar() {
    setEnviando(true);
    setError(null);
    const resultado = await confirmarPedidoDelivery({
      clienteNombre: nombre,
      clienteTelefono: telefono,
      direccionEntrega: direccion,
      notasEntrega: notas,
      metodoPago: metodo,
    });
    setEnviando(false);
    if (resultado.error || !resultado.pedido) {
      setError(resultado.error ?? "No se pudo confirmar.");
      return;
    }
    router.push(`/delivery/pedido/${resultado.pedido.folio}`);
  }

  return (
    <main className="flex flex-col gap-4 px-4">
      <Link href="/delivery/carrito" className="text-sm text-[var(--delivery-muted)]">
        ← Carrito
      </Link>
      <h1 className="text-xl font-bold">Checkout</h1>

      {haySupabase ? (
        <div className="rounded-2xl border border-[var(--delivery-line)] bg-white p-3 text-sm">
          <p className="text-[var(--delivery-muted)]">
            Cuenta opcional: si ya tienes perfil, guarda tu historial.
          </p>
          <Link
            href="/login?siguiente=/delivery/checkout"
            className="mt-2 inline-block font-semibold text-[var(--delivery-green-dark)] underline"
          >
            Entrar o crear cuenta
          </Link>
          <p className="mt-1 text-xs text-[var(--delivery-muted)]">
            Si no entras, usamos sesión anónima para el pedido.
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl bg-[var(--delivery-card)] p-4 shadow-sm">
        <p className="text-sm font-semibold text-[var(--delivery-green)]">
          Entrega en 25–35 min
        </p>
        <div className="mt-3 h-28 rounded-xl bg-gradient-to-br from-[var(--delivery-green-soft,#e8f5e9)] to-[var(--delivery-line)] p-3 text-xs text-[var(--delivery-muted)]">
          Mapa ilustrativo · escribe la dirección abajo
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">
          Nombre
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--delivery-line)] px-3 py-2 font-normal"
          />
        </label>
        <label className="text-sm font-medium">
          Teléfono
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--delivery-line)] px-3 py-2 font-normal"
          />
        </label>
        <label className="text-sm font-medium">
          Dirección de entrega
          <input
            required
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Calle, número, colonia"
            className="mt-1 w-full rounded-xl border border-[var(--delivery-line)] px-3 py-2 font-normal"
          />
        </label>
        <label className="text-sm font-medium">
          Referencia (opcional)
          <input
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--delivery-line)] px-3 py-2 font-normal"
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Pago (cobro al confirmar)</legend>
        {METODOS.map((m) => (
          <label
            key={m.id}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--delivery-line)] bg-white px-3 py-2 text-sm"
          >
            <input
              type="radio"
              name="metodo"
              checked={metodo === m.id}
              onChange={() => setMetodo(m.id)}
            />
            {m.titulo}
          </label>
        ))}
      </fieldset>

      <p className="text-lg font-bold">Total · ${total.toFixed(0)}</p>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        disabled={enviando || total <= 0}
        onClick={() => void confirmar()}
        className="delivery-btn-primary rounded-full py-3.5 text-sm font-bold disabled:opacity-50"
      >
        {enviando ? "Confirmando…" : "Confirmar y pagar"}
      </button>
    </main>
  );
}