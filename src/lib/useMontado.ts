"use client";

import { useSyncExternalStore } from "react";

function suscribir() {
  return () => {};
}

/** true en el navegador; false en SSR — evita desajustes de hidratación. */
export function useMontado() {
  return useSyncExternalStore(suscribir, () => true, () => false);
}