import type { Metadata } from "next";
import Link from "next/link";
import { DeliveryAuthInit } from "@/components/delivery/DeliveryAuthInit";
import { DeliveryNav } from "@/components/delivery/DeliveryNav";
import "./delivery-theme.css";

export const metadata: Metadata = {
  title: "Delivery · Trattoria Blue",
  description: "Pide a domicilio desde la trattoria.",
};

export default function DeliveryLayout({ children }: LayoutProps<"/delivery">) {
  return (
    <div className="delivery-shell mx-auto w-full max-w-md pb-24 pt-4">
      <header className="mb-4 flex items-center justify-between px-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--delivery-green)]">
            Trattoria Blue
          </p>
          <p className="text-lg font-bold">Delivery a domicilio</p>
        </div>
        <Link
          href="/"
          className="text-xs font-medium text-[var(--delivery-muted)] underline"
        >
          POS
        </Link>
      </header>
      <DeliveryAuthInit />
      {children}
      <DeliveryNav />
    </div>
  );
}