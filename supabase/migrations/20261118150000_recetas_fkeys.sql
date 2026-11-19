-- Llaves foráneas de recetas y receta_insumos (módulo Recetas).

delete from public.receta_insumos
where receta_id is null or insumo_id is null;

delete from public.recetas
where producto_id is null;

alter table public.recetas
  alter column producto_id set not null;

alter table public.receta_insumos
  alter column receta_id set not null,
  alter column insumo_id set not null;

alter table public.recetas
  add constraint recetas_rendimiento check (rendimiento > 0);

alter table public.receta_insumos
  add constraint receta_insumos_cantidad check (cantidad > 0);

alter table public.recetas
  add constraint recetas_producto_id_fkey
  foreign key (producto_id) references public.productos (id) on delete cascade;

alter table public.receta_insumos
  add constraint receta_insumos_receta_id_fkey
  foreign key (receta_id) references public.recetas (id) on delete cascade;

alter table public.receta_insumos
  add constraint receta_insumos_insumo_id_fkey
  foreign key (insumo_id) references public.productos (id) on delete cascade;

create unique index recetas_producto_id_uq
  on public.recetas (producto_id);

create unique index receta_insumos_receta_insumo_uq
  on public.receta_insumos (receta_id, insumo_id);