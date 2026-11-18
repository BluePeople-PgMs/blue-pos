"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuModulos } from "@/lib/navegacion";

export function MenuModulos() {
  const pathname = usePathname();

  return (
    <nav
      className="border-t border-line bg-background/60"
      aria-label="Módulos del sistema"
    >
      <div className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 py-2">
        {menuModulos.map((item) => {
          const activo =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                activo
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-accent-soft hover:text-accent"
              }`}
            >
              {item.nombre}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}