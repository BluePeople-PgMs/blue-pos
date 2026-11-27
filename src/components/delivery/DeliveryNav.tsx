"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { resumenCarrito } from "@/lib/delivery-storage";

export function DeliveryNav() {
  const ruta = usePathname();
  const [items, setItems] = useState(0);

  useEffect(() => {
    const actualizar = () => setItems(resumenCarrito().items);
    actualizar();
    window.addEventListener("storage", actualizar);
    window.addEventListener("focus", actualizar);
    return () => {
      window.removeEventListener("storage", actualizar);
      window.removeEventListener("focus", actualizar);
    };
  }, [ruta]);

  const enlaces = [
    { href: "/delivery", etiqueta: "Inicio" },
    { href: "/delivery/carrito", etiqueta: "Carrito", badge: items },
    { href: "/delivery/seguimiento", etiqueta: "Seguir" },
    { href: "/delivery/cocina", etiqueta: "Cocina" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md justify-around border-t border-[var(--delivery-line)] bg-[var(--delivery-card)] px-2 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      aria-label="Delivery"
    >
      {enlaces.map((enlace) => {
        const activo =
          enlace.href === "/delivery"
            ? ruta === "/delivery"
            : ruta.startsWith(enlace.href);
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={`relative flex flex-1 flex-col items-center rounded-xl px-2 py-1.5 text-xs font-semibold ${
              activo ? "text-[var(--delivery-green)]" : "text-[var(--delivery-muted)]"
            }`}
          >
            {enlace.etiqueta}
            {(enlace.badge ?? 0) > 0 ? (
              <span className="absolute right-1/4 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--delivery-green)] px-1 text-[10px] text-white">
                {enlace.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}