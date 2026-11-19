-- Idempotente: seguro si parte de 20261118150000 ya está aplicada.
-- Ejecutar en SQL Editor del proyecto blue-pos (rol postgres) o con psql.

delete from public.receta_insumos
where receta_id is null or insumo_id is null;

delete from public.recetas
where producto_id is null;

alter table public.recetas
  alter column producto_id set not null;

alter table public.receta_insumos
  alter column receta_id set not null,
  alter column insumo_id set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recetas_rendimiento'
  ) then
    alter table public.recetas
      add constraint recetas_rendimiento check (rendimiento > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'receta_insumos_cantidad'
  ) then
    alter table public.receta_insumos
      add constraint receta_insumos_cantidad check (cantidad > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recetas_producto_id_fkey'
  ) then
    alter table public.recetas
      add constraint recetas_producto_id_fkey
      foreign key (producto_id) references public.productos (id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'receta_insumos_receta_id_fkey'
  ) then
    alter table public.receta_insumos
      add constraint receta_insumos_receta_id_fkey
      foreign key (receta_id) references public.recetas (id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'receta_insumos_insumo_id_fkey'
  ) then
    alter table public.receta_insumos
      add constraint receta_insumos_insumo_id_fkey
      foreign key (insumo_id) references public.productos (id) on delete cascade;
  end if;
end $$;

create unique index if not exists recetas_producto_id_uq
  on public.recetas (producto_id);

create unique index if not exists receta_insumos_receta_insumo_uq
  on public.receta_insumos (receta_id, insumo_id);