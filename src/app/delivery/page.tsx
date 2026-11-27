"use client";

import { useEffect, useMemo, useState } from "react";
import { DeliveryProductCard } from "@/components/delivery/DeliveryProductCard";
import {
  CATEGORIAS,
  PRODUCTOS,
  type CategoriaDelivery,
  type ProductoDelivery,
} from "@/lib/delivery-mock";
import { leerMenuDelivery } from "@/lib/delivery";

export default function DeliveryInicioPage() {
  const [categoria, setCategoria] = useState<CategoriaDelivery | "Todos">(
    "Todos",
  );
  const [catalogo, setCatalogo] = useState<ProductoDelivery[]>(PRODUCTOS);
  const [origen, setOrigen] = useState<"local" | "supabase">("local");

  useEffect(() => {
    void leerMenuDelivery().then((r) => {
      setCatalogo(r.productos);
      setOrigen(r.origen);
    });
  }, []);

  const productos = useMemo(() => {
    if (categoria === "Todos") return catalogo;
    return catalogo.filter((p) => p.categoria === categoria);
  }, [categoria, catalogo]);

  return (
    <main className="flex flex-col gap-5 px-4">
      <section className="rounded-3xl bg-[var(--delivery-green)] px-5 py-6 text-white">
        <h1 className="text-2xl font-bold leading-tight">
          Tu dosis diaria de felicitá
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/90">
          Catálogo{" "}
          {origen === "supabase" ? "desde Supabase" : "demo local"} · pedido a
          domicilio con seguimiento en tiempo real.
        </p>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["Todos", ...CATEGORIAS] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoria(cat)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              categoria === cat
                ? "delivery-chip-active"
                : "bg-[var(--delivery-card)] text-[var(--delivery-muted)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-base font-bold">Sugeridos</h2>
        <div className="grid grid-cols-2 gap-3">
          {productos.map((p) => (
            <DeliveryProductCard key={p.id} producto={p} />
          ))}
        </div>
      </section>
    </main>
  );
}