-- Blue POS — esquema para proyecto Supabase nuevo (ej. slytherin-kratos).
-- Ejecuta TODO este archivo en: Supabase → SQL → New query → Run.
-- Después: en la carpeta del repo, `npm run sembrar:catalogo`
-- Luego ejecuta: supabase/SETUP_KRATOS_EXISTENCIAS.sql

-- ===== 20261118120000_cascaron.sql =====
-- Cascarón de Blue POS 2.0.
-- Sin datos de ejemplo.
-- Login: Supabase Auth más la tabla perfiles. La pantalla la construye el equipo.
-- Inventario: entradas capturadas, salidas por venta cobrada y cancelaciones.
-- La existencia no se mueve sola. El SQL solo impide un movimiento mal formado.
-- Categorías, unidades, recetas y combos siguen sin llave foránea.

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  abreviatura text not null
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  -- Valores previstos: directo, preparado, insumo, combo. Sin check, para que el equipo pueda ajustar el criterio.
  tipo text not null,
  -- Ejemplo de columna que el equipo puede relacionar con categorias(id). La llave foránea no se crea aquí.
  categoria_id uuid,
  unidad_id uuid,
  precio numeric(12, 2),
  codigo text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.cajas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activa boolean not null default true
);

create table public.recetas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid,
  nombre text not null,
  rendimiento numeric(12, 3) not null default 1
);

create table public.receta_insumos (
  id uuid primary key default gen_random_uuid(),
  receta_id uuid,
  insumo_id uuid,
  cantidad numeric(12, 3) not null
);

create table public.combo_componentes (
  id uuid primary key default gen_random_uuid(),
  combo_id uuid,
  producto_id uuid,
  cantidad numeric(12, 3) not null default 1
);

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  created_at timestamptz not null default now()
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  caja_id uuid,
  folio text,
  estado text not null default 'abierta',
  total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint ventas_estado check (estado in ('abierta', 'cobrada', 'cancelada'))
);

create table public.venta_lineas (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id),
  producto_id uuid,
  cantidad numeric(12, 3) not null,
  precio_unitario numeric(12, 2) not null,
  notas text
);

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid,
  metodo text not null,
  monto numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table public.cancelaciones (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas (id),
  motivo text,
  created_at timestamptz not null default now()
);

create table public.existencias (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null unique references public.productos (id),
  cantidad numeric(12, 3) not null default 0
);

create table public.movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id),
  caja_id uuid,
  venta_id uuid references public.ventas (id),
  tipo text not null,
  cantidad numeric(12, 3) not null,
  nota text,
  created_at timestamptz not null default now(),
  constraint movimientos_tipo check (tipo in ('entrada', 'salida_venta', 'cancelacion')),
  constraint movimientos_cantidad check (cantidad > 0),
  constraint movimientos_origen check (
    (tipo = 'entrada' and venta_id is null)
    or (tipo in ('salida_venta', 'cancelacion') and venta_id is not null)
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.categorias,
  public.unidades,
  public.productos,
  public.cajas,
  public.recetas,
  public.receta_insumos,
  public.combo_componentes
to anon, authenticated;

grant select, insert, update, delete on
  public.perfiles,
  public.existencias,
  public.movimientos_inventario,
  public.ventas,
  public.venta_lineas,
  public.pagos,
  public.cancelaciones
to authenticated;

alter table public.perfiles enable row level security;
alter table public.existencias enable row level security;
alter table public.movimientos_inventario enable row level security;
alter table public.ventas enable row level security;
alter table public.venta_lineas enable row level security;
alter table public.pagos enable row level security;
alter table public.cancelaciones enable row level security;

create policy perfiles_authenticated_all
  on public.perfiles
  for all
  to authenticated
  using (true)
  with check (true);

create policy existencias_authenticated_all
  on public.existencias
  for all
  to authenticated
  using (true)
  with check (true);

create policy movimientos_authenticated_all
  on public.movimientos_inventario
  for all
  to authenticated
  using (true)
  with check (true);

create policy ventas_authenticated_all
  on public.ventas
  for all
  to authenticated
  using (true)
  with check (true);

create policy venta_lineas_authenticated_all
  on public.venta_lineas
  for all
  to authenticated
  using (true)
  with check (true);

create policy pagos_authenticated_all
  on public.pagos
  for all
  to authenticated
  using (true)
  with check (true);

create policy cancelaciones_authenticated_all
  on public.cancelaciones
  for all
  to authenticated
  using (true)
  with check (true);

-- ===== 20261118231000_productos_categoria_fkey.sql =====
-- Relación que el catálogo usa: cada producto pertenece a una categoría.
-- El cascarón deja categoria_id sin llave foránea a propósito.

alter table public.productos
  add constraint productos_categoria_id_fkey
  foreign key (categoria_id) references public.categorias (id);

-- ===== 20261120120000_combo_rol.sql =====
-- Rol de cada pieza del combo (entrada, bebida, plato fuerte).
alter table public.combo_componentes
  add column if not exists rol text;

comment on column public.combo_componentes.rol is
  'entrada | bebida | plato_fuerte';
-- ===== 20261120140000_perfiles_rol.sql =====
-- Rol de aplicación: cajero (cobro) o administrador (inventario, consultas y catálogos).

alter table public.perfiles
  add column if not exists rol text not null default 'cajero';

alter table public.perfiles
  drop constraint if exists perfiles_rol_check;

alter table public.perfiles
  add constraint perfiles_rol_check check (rol in ('cajero', 'administrador'));

comment on column public.perfiles.rol is
  'cajero: ventas y consulta de catálogo. administrador: inventario, pagos, cancelaciones y módulos de configuración.';
-- ===== 20261120195000_categoria_combos.sql =====
-- Categoría para productos tipo combo generados desde la app.
insert into public.categorias (nombre, orden)
select 'Combos', 105
where not exists (
  select 1 from public.categorias c where c.nombre = 'Combos'
);
