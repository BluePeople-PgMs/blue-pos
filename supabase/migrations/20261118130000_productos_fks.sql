-- Relaciones de ejemplo: productos hacia categorías y unidades.

alter table public.productos
  add constraint productos_categoria_id_fkey
  foreign key (categoria_id) references public.categorias (id);

alter table public.productos
  add constraint productos_unidad_id_fkey
  foreign key (unidad_id) references public.unidades (id);