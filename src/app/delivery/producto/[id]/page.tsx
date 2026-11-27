"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { agregarAlCarrito } from "@/lib/delivery-storage";
import { productoPorId, type ProductoDelivery } from "@/lib/delivery-mock";
import { leerMenuDelivery } from "@/lib/delivery";
import { urlImagenCatalogo } from "@/lib/imagen-catalogo";

export default function DeliveryProductoPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [producto, setProducto] = useState<ProductoDelivery | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [notas, setNotas] = useState("");

  useEffect(() => {
    const local = productoPorId(id);
    if (local) {
      setProducto(local);
      return;
    }
    void leerMenuDelivery().then((r) => {
      setProducto(r.productos.find((p) => p.id === id) ?? null);
    });
  }, [id]);

  if (!producto) {
    return (
      <main className="px-4">
        <p className="text-sm">Cargando o producto no encontrado.</p>
        <Link href="/delivery" className="mt-2 text-sm text-[var(--delivery-green)]">
          Volver al menú
        </Link>
      </main>
    );
  }

  const imagen = urlImagenCatalogo({
    codigo: producto.codigo,
    nombre: producto.nombre,
    categoria: producto.categoria,
  });

  const productoOk = producto;

  function anadir() {
    if (!productoOk) return;
    agregarAlCarrito(productoOk.id, cantidad, notas);
    router.push("/delivery/carrito");
  }

  return (
    <main className="flex flex-col gap-4 px-4">
      <Link href="/delivery" className="text-sm text-[var(--delivery-muted)]">
        ← Menú
      </Link>
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[var(--delivery-line)]">
        <Image src={imagen} alt="" fill className="object-cover" sizes="448px" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{producto.nombre}</h1>
        <p className="mt-1 text-sm text-[var(--delivery-muted)]">
          ⭐ 4.9 · 25–35 min
        </p>
        <p className="mt-3 text-sm leading-6">{producto.descripcion}</p>
        <p className="mt-3 text-xl font-bold text-[var(--delivery-green-dark)]">
          ${producto.precio.toFixed(0)}
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Notas
        <input
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Sin cebolla, extra queso…"
          className="rounded-xl border border-[var(--delivery-line)] bg-white px-3 py-2 font-normal"
        />
      </label>
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold">Cantidad</span>
        <button
          type="button"
          className="h-10 w-10 rounded-full border border-[var(--delivery-line)] bg-white text-lg"
          onClick={() => setCantidad((c) => Math.max(1, c - 1))}
        >
          −
        </button>
        <span className="min-w-8 text-center font-bold">{cantidad}</span>
        <button
          type="button"
          className="h-10 w-10 rounded-full border border-[var(--delivery-line)] bg-white text-lg"
          onClick={() => setCantidad((c) => c + 1)}
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={anadir}
        className="delivery-btn-green mt-2 w-full rounded-full py-3.5 text-sm font-bold"
      >
        Añadir al carrito · ${(producto.precio * cantidad).toFixed(0)}
      </button>
    </main>
  );
}