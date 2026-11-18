-- Relación que el catálogo usa: cada producto pertenece a una categoría.
-- El cascarón deja categoria_id sin llave foránea a propósito.

alter table public.productos
  add constraint productos_categoria_id_fkey
  foreign key (categoria_id) references public.categorias (id);
