-- Llaves foráneas de combo_componentes hacia productos (módulo Combos).

delete from public.combo_componentes
where combo_id is null or producto_id is null;

alter table public.combo_componentes
  alter column combo_id set not null,
  alter column producto_id set not null;

alter table public.combo_componentes
  add constraint combo_componentes_cantidad check (cantidad > 0);

alter table public.combo_componentes
  add constraint combo_componentes_combo_id_fkey
  foreign key (combo_id) references public.productos (id) on delete cascade;

alter table public.combo_componentes
  add constraint combo_componentes_producto_id_fkey
  foreign key (producto_id) references public.productos (id) on delete cascade;

create unique index combo_componentes_combo_producto_uq
  on public.combo_componentes (combo_id, producto_id);