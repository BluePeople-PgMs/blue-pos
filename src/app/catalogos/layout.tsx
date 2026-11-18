import Link from "next/link";
import { RequiereSesion } from "@/components/RequiereSesion";
import { SelectorCatalogo } from "@/components/SelectorCatalogo";

export default function CatalogosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequiereSesion>
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold tracking-[0.14em] text-accent uppercase">
            Catálogos
          </p>
          <Link href="/" className="text-sm font-medium text-muted">
            Inicio
          </Link>
        </div>
        <SelectorCatalogo />
      </header>
      {children}
    </main>
    </RequiereSesion>
  );
}
