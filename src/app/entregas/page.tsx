import Link from "next/link";
import { EntregasVista } from "@/components/entregas/EntregasVista";
import { RequiereSesion } from "@/components/RequiereSesion";

export const metadata = {
  title: "Entregas · Trattoria Blue",
};

export default function EntregasPage() {
  return (
    <RequiereSesion>
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-4 py-6 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
              Domicilio
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Entregas a domicilio
            </h1>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            Inicio
          </Link>
        </header>
        <EntregasVista />
      </main>
    </RequiereSesion>
  );
}