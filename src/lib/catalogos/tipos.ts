export const TIPOS_PRODUCTO = [
  "directo",
  "preparado",
  "insumo",
  "combo",
] as const;

export type TipoProducto = (typeof TIPOS_PRODUCTO)[number];

export type Categoria = {
  id: string;
  nombre: string;
  orden: number;
  created_at: string;
};

export type Unidad = {
  id: string;
  nombre: string;
  abreviatura: string;
};

export type Caja = {
  id: string;
  nombre: string;
  activa: boolean;
};

export type Producto = {
  id: string;
  nombre: string;
  tipo: string;
  categoria_id: string | null;
  unidad_id: string | null;
  precio: number | null;
  codigo: string | null;
  activo: boolean;
  created_at: string;
};

export type ProductoOpcion = {
  id: string;
  nombre: string;
  codigo: string | null;
};

export function esTipoProducto(valor: string): valor is TipoProducto {
  return (TIPOS_PRODUCTO as readonly string[]).includes(valor);
}