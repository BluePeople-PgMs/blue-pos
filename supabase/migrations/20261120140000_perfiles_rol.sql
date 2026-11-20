-- Rol de aplicación: cajero (cobro) o administrador (inventario, consultas y catálogos).

alter table public.perfiles
  add column if not exists rol text not null default 'cajero';

alter table public.perfiles
  drop constraint if exists perfiles_rol_check;

alter table public.perfiles
  add constraint perfiles_rol_check check (rol in ('cajero', 'administrador'));

comment on column public.perfiles.rol is
  'cajero: ventas y consulta de catálogo. administrador: inventario, pagos, cancelaciones y módulos de configuración.';