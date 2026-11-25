/** Capa fija solo decorativa; el contenido va en `.brand-app` encima. */
export function BrandBackdrop() {
  return (
    <div className="brand-backdrop" aria-hidden="true">
      <span className="brand-shape brand-shape--navy opacity-[0.12]" />
      <span className="brand-shape brand-shape--coral opacity-[0.08]" />
    </div>
  );
}