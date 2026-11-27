-- Delivery a domicilio: campos en ventas (SlytherinDeliveryKratos)

alter table public.ventas
  add column if not exists modalidad text not null default 'local',
  add column if not exists entrega_estado text,
  add column if not exists cliente_nombre text,
  add column if not exists cliente_telefono text,
  add column if not exists direccion_entrega text,
  add column if not exists notas_entrega text;

alter table public.ventas
  drop constraint if exists ventas_modalidad_check;

alter table public.ventas
  add constraint ventas_modalidad_check
  check (modalidad in ('local', 'delivery'));

alter table public.ventas
  drop constraint if exists ventas_entrega_estado_check;

alter table public.ventas
  add constraint ventas_entrega_estado_check
  check (
    entrega_estado is null
    or entrega_estado in ('recibido', 'preparando', 'en_camino', 'entregado')
  );

alter table public.ventas
  drop constraint if exists ventas_delivery_datos_check;

alter table public.ventas
  add constraint ventas_delivery_datos_check
  check (
  modalidad = 'local'
    or (
      modalidad = 'delivery'
      and cliente_nombre is not null
      and char_length(trim(cliente_nombre)) > 0
      and direccion_entrega is not null
      and char_length(trim(direccion_entrega)) > 0
    )
  );

create index if not exists ventas_delivery_cola_idx
  on public.ventas (modalidad, entrega_estado, created_at desc)
  where modalidad = 'delivery';

comment on column public.ventas.modalidad is 'local en mostrador o delivery a domicilio.';
comment on column public.ventas.entrega_estado is 'Solo delivery: recibido → preparando → en_camino → entregado.';