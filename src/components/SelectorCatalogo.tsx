"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const opciones = [
  { href: "/catalogos/comidas", label: "Comidas preparadas" },
  { href: "/catalogos/productos", label: "Productos terminados" },
] as const;

export function SelectorCatalogo() {
  const ruta = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Catálogos">
      {opciones.map((opcion) => {
        const activo = ruta === opcion.href;
        return (
          <Link
            key={opcion.href}
            href={opcion.href}
            aria-current={activo ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              activo
                ? "bg-accent text-white"
                : "border border-line bg-card text-foreground"
            }`}
          >
            {opcion.label}
          </Link>
        );
      })}
    </nav>
  );
}
