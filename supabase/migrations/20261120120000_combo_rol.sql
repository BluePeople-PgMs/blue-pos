-- Rol de cada pieza del combo (entrada, bebida, plato fuerte).
alter table public.combo_componentes
  add column if not exists rol text;

comment on column public.combo_componentes.rol is
  'entrada | bebida | plato_fuerte';