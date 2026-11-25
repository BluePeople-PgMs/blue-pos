"use client";

import type { ReactNode } from "react";

type PosLayoutProps = {
  catalogo: ReactNode;
  ticket: ReactNode;
  inferior?: ReactNode;
};

/** Layout 70/30 catálogo + ticket sticky (POS). */
export function PosLayout({ catalogo, ticket, inferior }: PosLayoutProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
        <div className="min-w-0">{catalogo}</div>
        <aside className="cine-ticket-sticky min-w-0">{ticket}</aside>
      </div>
      {inferior ? <div className="min-w-0">{inferior}</div> : null}
    </div>
  );
}