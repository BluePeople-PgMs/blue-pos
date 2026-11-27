import Image from "next/image";
import Link from "next/link";
import type { ProductoDelivery } from "@/lib/delivery-mock";
import { urlImagenCatalogo } from "@/lib/imagen-catalogo";

export function DeliveryProductCard({ producto }: { producto: ProductoDelivery }) {
  const imagen = urlImagenCatalogo({
    codigo: producto.codigo,
    nombre: producto.nombre,
    categoria: producto.categoria,
  });

  return (
    <Link
      href={`/delivery/producto/${producto.id}`}
      className="flex flex-col overflow-hidden rounded-2xl bg-[var(--delivery-card)] shadow-sm"
    >
      <div className="relative aspect-[4/3] w-full bg-[var(--delivery-line)]">
        <Image
          src={imagen}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 448px) 50vw, 200px"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">
          {producto.nombre}
        </p>
        <p className="mt-auto text-sm font-bold text-[var(--delivery-green-dark)]">
          ${producto.precio.toFixed(0)}
        </p>
      </div>
    </Link>
  );
}