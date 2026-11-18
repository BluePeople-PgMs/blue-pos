export function nombreRequerido(nombre: string): string | null {
  if (!nombre.trim()) {
    return "El nombre es obligatorio.";
  }
  return null;
}

export function ordenValido(orden: number): string | null {
  if (!Number.isFinite(orden) || orden < 0) {
    return "El orden debe ser un número mayor o igual a cero.";
  }
  return null;
}

export function abreviaturaRequerida(abreviatura: string): string | null {
  if (!abreviatura.trim()) {
    return "La abreviatura es obligatoria.";
  }
  return null;
}

export function precioValido(precio: string): string | null {
  const limpio = precio.trim();
  if (!limpio) {
    return null;
  }
  const valor = Number(limpio);
  if (!Number.isFinite(valor) || valor < 0) {
    return "El precio debe ser un número mayor o igual a cero.";
  }
  return null;
}