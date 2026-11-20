/** Capa fija solo decorativa; el contenido va en `.brand-app` encima. */
export function BrandBackdrop() {
  return (
    <div className="brand-backdrop" aria-hidden="true">
      <span className="brand-shape brand-shape--navy" />
      <span className="brand-shape brand-shape--coral" />
    </div>
  );
}