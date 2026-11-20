-- Categoría para productos tipo combo generados desde la app.
insert into public.categorias (nombre, orden)
select 'Combos', 105
where not exists (
  select 1 from public.categorias c where c.nombre = 'Combos'
);