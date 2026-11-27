"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRol } from "@/components/contexto/RolContext";
import type { RolSistema } from "@/lib/roles";

type EnlaceNav = {
  href: string;
  etiqueta: string;
  corto: string;
  roles: RolSistema[];
};

const ENLACES: EnlaceNav[] = [
  { href: "/", etiqueta: "Inicio", corto: "⌂", roles: ["cajero", "administrador"] },
  { href: "/ventas", etiqueta: "Vender", corto: "🧾", roles: ["cajero", "administrador"] },
  {
    href: "/inventario",
    etiqueta: "Inventario",
    corto: "📦",
    roles: ["administrador"],
  },
  {
    href: "/catalogos",
    etiqueta: "Catálogo",
    corto: "☰",
    roles: ["cajero", "administrador"],
  },
];

export function NavMovilPrototipo() {
  const ruta = usePathname();
  const { rol, estado } = useRol();
  const rolActivo = estado === "listo" ? rol : "cajero";
  const enlaces = ENLACES.filter((e) => e.roles.includes(rolActivo));

  if (ruta.startsWith("/delivery")) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 px-2 py-2 backdrop-blur-sm md:hidden"
      aria-label="Accesos rápidos"
    >
      <ul className="mx-auto flex max-w-lg justify-between gap-1">
        {enlaces.map((item) => {
          const activo =
            item.href === "/"
              ? ruta === "/"
              : ruta === item.href || ruta.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-center text-xs font-semibold ${
                  activo ? "bg-accent-soft text-accent" : "text-muted"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {item.corto}
                </span>
                <span>{item.etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}