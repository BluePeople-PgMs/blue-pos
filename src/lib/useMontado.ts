"use client";

import { useEffect, useState } from "react";

/** true solo tras el primer montaje en el navegador (evita desajustes de hidratación). */
export function useMontado() {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
}