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

-- ===== 20261118130000_productos_fks.sql =====
-- Relaciones de ejemplo: productos hacia categorías y unidades.

alter table public.productos
  add constraint productos_categoria_id_fkey
  foreign key (categoria_id) references public.categorias (id);

alter table public.productos
  add constraint productos_unidad_id_fkey
  foreign key (unidad_id) references public.unidades (id);
-- ===== 20261118140000_combo_componentes_fkeys.sql =====
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
-- ===== 20261118150000_recetas_fkeys.sql =====
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
-- ===== 20261118200000_confirmar_correo_al_registrar.sql =====
-- El proyecto alojado tiene mailer_autoconfirm = false, así que signUp
-- crea el usuario y no devuelve sesión. Este trigger marca el correo como
-- confirmado en la misma transacción; el cliente inicia sesión enseguida.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
  where id = new.id;

  insert into public.perfiles (id) values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now())
where email_confirmed_at is null;

-- ===== 20261120120000_perfiles_rol.sql =====
-- Roles de restaurante en perfiles (mesero | administrador).

alter table public.perfiles
  add column if not exists rol text;

update public.perfiles
set rol = 'mesero'
where rol is null;

alter table public.perfiles
  alter column rol set default 'mesero',
  alter column rol set not null;

alter table public.perfiles
  add constraint perfiles_rol check (rol in ('mesero', 'administrador'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
  where id = new.id;

  insert into public.perfiles (id, rol)
  values (new.id, 'mesero')
  on conflict (id) do update set rol = coalesce(public.perfiles.rol, 'mesero');

  return new;
end;
$$;

-- Promover administrador (ejemplo):
-- update public.perfiles set rol = 'administrador'
-- where id = (select id from auth.users where email = 'admin@ejemplo.com');
