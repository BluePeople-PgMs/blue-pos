export function etiquetaProducto(nombre: string, codigo: string | null): string {
  return codigo ? `${nombre} (${codigo})` : nombre;
}