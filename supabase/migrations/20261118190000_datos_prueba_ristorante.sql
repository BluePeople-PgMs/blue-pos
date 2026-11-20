-- Datos de prueba: restaurante italiano, Caja salón.
-- Aplica solo en una base vacía después del cascarón (sin catálogo de la trattoria).
-- Si ya corriste npm run sembrar:catalogo, no ejecutes este archivo: duplicaría filas.
-- La base no mueve existencias. Aquí queda el saldo final y el historial
-- que lo explica. Las pantallas de Ventas e Inventario las arma el equipo.
--
-- Entradas: lasagna 12, pizza 20, tiramisù 8, acqua 24, vino 10,
-- spaghetti 5 kg, guanciale 2 kg, farina 10 kg, mozzarella 4 kg, pomodoro 6 kg.
--
-- Folio 1001 cobrada: 2 lasagna + 1 acqua + 1 vino = 735. Pago en efectivo.
--   Salidas ya restadas (lasagna 10, acqua 23, vino 9).
-- Folio 1002 cancelada: 1 pizza a 180, tarjeta, motivo "El cliente se fue".
--   Salida y cancelación se compensan: la pizza sigue en 20.
-- Folio 1003 abierta: 1 tiramisù + 1 acqua = 130. Sin pago y sin movimiento.
--
-- Saldo final: lasagna 10, pizza 20, tiramisù 8, acqua 23, vino 9,
-- insumos iguales a su entrada.

-- Unidades. "g" queda disponible; ningún producto de prueba la usa.
insert into public.unidades (id, nombre, abreviatura) values
  ('11111111-0001-4000-8000-000000000001', 'porción', 'por'),
  ('11111111-0001-4000-8000-000000000002', 'pieza', 'pza'),
  ('11111111-0001-4000-8000-000000000003', 'botella', 'bot'),
  ('11111111-0001-4000-8000-000000000004', 'kg', 'kg'),
  ('11111111-0001-4000-8000-000000000005', 'g', 'g');

-- Antipasti no tiene producto en esta fase.
insert into public.categorias (id, nombre, orden) values
  ('22222222-0002-4000-8000-000000000001', 'Antipasti', 1),
  ('22222222-0002-4000-8000-000000000002', 'Primi', 2),
  ('22222222-0002-4000-8000-000000000003', 'Pizze', 3),
  ('22222222-0002-4000-8000-000000000004', 'Dolci', 4),
  ('22222222-0002-4000-8000-000000000005', 'Bevande', 5),
  ('22222222-0002-4000-8000-000000000006', 'Insumos', 6);

-- tipo previsto por el cascarón: directo, preparado, insumo, combo.
-- Los platillos son preparado, las bebidas directo y los insumos no se venden.
insert into public.productos (
  id,
  nombre,
  tipo,
  categoria_id,
  unidad_id,
  precio,
  activo
) values
  (
    '33333333-0003-4000-8000-000000000001',
    'Lasagna della casa',
    'preparado',
    '22222222-0002-4000-8000-000000000002',
    '11111111-0001-4000-8000-000000000001',
    210.00,
    true
  ),
  (
    '33333333-0003-4000-8000-000000000002',
    'Pizza Margherita',
    'preparado',
    '22222222-0002-4000-8000-000000000003',
    '11111111-0001-4000-8000-000000000002',
    180.00,
    true
  ),
  (
    '33333333-0003-4000-8000-000000000003',
    'Tiramisù',
    'preparado',
    '22222222-0002-4000-8000-000000000004',
    '11111111-0001-4000-8000-000000000001',
    95.00,
    true
  ),
  (
    '33333333-0003-4000-8000-000000000004',
    'Acqua naturale',
    'directo',
    '22222222-0002-4000-8000-000000000005',
    '11111111-0001-4000-8000-000000000002',
    35.00,
    true
  ),
  (
    '33333333-0003-4000-8000-000000000005',
    'Vino della casa',
    'directo',
    '22222222-0002-4000-8000-000000000005',
    '11111111-0001-4000-8000-000000000003',
    280.00,
    true
  ),
  (
    '33333333-0003-4000-8000-000000000006',
    'Spaghetti',
    'insumo',
    '22222222-0002-4000-8000-000000000006',
    '11111111-0001-4000-8000-000000000004',
    null,
    true
  ),
  (
    '33333333-0003-4000-8000-000000000007',
    'Guanciale',
    'insumo',
    '22222222-0002-4000-8000-000000000006',
    '11111111-0001-4000-8000-000000000004',
    null,
    true
  ),
  (
    '33333333-0003-4000-8000-000000000008',
    'Farina 00',
    'insumo',
    '22222222-0002-4000-8000-000000000006',
    '11111111-0001-4000-8000-000000000004',
    null,
    true
  ),
  (
    '33333333-0003-4000-8000-000000000009',
    'Mozzarella fior di latte',
    'insumo',
    '22222222-0002-4000-8000-000000000006',
    '11111111-0001-4000-8000-000000000004',
    null,
    true
  ),
  (
    '33333333-0003-4000-8000-00000000000a',
    'Pomodoro pelato',
    'insumo',
    '22222222-0002-4000-8000-000000000006',
    '11111111-0001-4000-8000-000000000004',
    null,
    true
  );

insert into public.cajas (id, nombre, activa) values
  ('44444444-0004-4000-8000-000000000001', 'Caja salón', true);

-- Saldo final, no la entrada. La pantalla es quien suma y resta; el seed
-- deja el resultado después de cobrar el 1001 y cancelar el 1002.
insert into public.existencias (id, producto_id, cantidad) values
  ('55555555-0005-4000-8000-000000000001', '33333333-0003-4000-8000-000000000001', 10),
  ('55555555-0005-4000-8000-000000000002', '33333333-0003-4000-8000-000000000002', 20),
  ('55555555-0005-4000-8000-000000000003', '33333333-0003-4000-8000-000000000003', 8),
  ('55555555-0005-4000-8000-000000000004', '33333333-0003-4000-8000-000000000004', 23),
  ('55555555-0005-4000-8000-000000000005', '33333333-0003-4000-8000-000000000005', 9),
  ('55555555-0005-4000-8000-000000000006', '33333333-0003-4000-8000-000000000006', 5),
  ('55555555-0005-4000-8000-000000000007', '33333333-0003-4000-8000-000000000007', 2),
  ('55555555-0005-4000-8000-000000000008', '33333333-0003-4000-8000-000000000008', 10),
  ('55555555-0005-4000-8000-000000000009', '33333333-0003-4000-8000-000000000009', 4),
  ('55555555-0005-4000-8000-00000000000a', '33333333-0003-4000-8000-00000000000a', 6);

insert into public.ventas (id, caja_id, folio, estado, total, created_at) values
  (
    '66666666-0006-4000-8000-000000000001',
    '44444444-0004-4000-8000-000000000001',
    '1001',
    'cobrada',
    735.00,
    timestamptz '2026-11-18 12:15:00-06'
  ),
  (
    '66666666-0006-4000-8000-000000000002',
    '44444444-0004-4000-8000-000000000001',
    '1002',
    'cancelada',
    180.00,
    timestamptz '2026-11-18 13:05:00-06'
  ),
  (
    '66666666-0006-4000-8000-000000000003',
    '44444444-0004-4000-8000-000000000001',
    '1003',
    'abierta',
    130.00,
    timestamptz '2026-11-18 14:00:00-06'
  );

-- 1001: 2 * 210 + 35 + 280 = 735
-- 1002: 1 * 180 = 180
-- 1003: 95 + 35 = 130
insert into public.venta_lineas (id, venta_id, producto_id, cantidad, precio_unitario) values
  (
    '77777777-0007-4000-8000-000000000001',
    '66666666-0006-4000-8000-000000000001',
    '33333333-0003-4000-8000-000000000001',
    2,
    210.00
  ),
  (
    '77777777-0007-4000-8000-000000000002',
    '66666666-0006-4000-8000-000000000001',
    '33333333-0003-4000-8000-000000000004',
    1,
    35.00
  ),
  (
    '77777777-0007-4000-8000-000000000003',
    '66666666-0006-4000-8000-000000000001',
    '33333333-0003-4000-8000-000000000005',
    1,
    280.00
  ),
  (
    '77777777-0007-4000-8000-000000000004',
    '66666666-0006-4000-8000-000000000002',
    '33333333-0003-4000-8000-000000000002',
    1,
    180.00
  ),
  (
    '77777777-0007-4000-8000-000000000005',
    '66666666-0006-4000-8000-000000000003',
    '33333333-0003-4000-8000-000000000003',
    1,
    95.00
  ),
  (
    '77777777-0007-4000-8000-000000000006',
    '66666666-0006-4000-8000-000000000003',
    '33333333-0003-4000-8000-000000000004',
    1,
    35.00
  );

-- pagos.venta_id no tiene llave foránea; igual se llena.
-- La venta abierta 1003 no tiene pago.
insert into public.pagos (id, venta_id, metodo, monto, created_at) values
  (
    '88888888-0008-4000-8000-000000000001',
    '66666666-0006-4000-8000-000000000001',
    'efectivo',
    735.00,
    timestamptz '2026-11-18 12:15:00-06'
  ),
  (
    '88888888-0008-4000-8000-000000000002',
    '66666666-0006-4000-8000-000000000002',
    'tarjeta',
    180.00,
    timestamptz '2026-11-18 13:05:00-06'
  );

insert into public.cancelaciones (id, venta_id, motivo, created_at) values
  (
    '99999999-0009-4000-8000-000000000001',
    '66666666-0006-4000-8000-000000000002',
    'El cliente se fue',
    timestamptz '2026-11-18 13:20:00-06'
  );

-- Entradas sin venta_id. Cantidades de apertura, no el saldo.
insert into public.movimientos_inventario (
  id,
  producto_id,
  caja_id,
  venta_id,
  tipo,
  cantidad,
  nota,
  created_at
) values
  (
    'aaaaaaaa-0001-4000-8000-000000000001',
    '33333333-0003-4000-8000-000000000001',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    12,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000002',
    '33333333-0003-4000-8000-000000000002',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    20,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000003',
    '33333333-0003-4000-8000-000000000003',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    8,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000004',
    '33333333-0003-4000-8000-000000000004',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    24,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000005',
    '33333333-0003-4000-8000-000000000005',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    10,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000006',
    '33333333-0003-4000-8000-000000000006',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    5,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000007',
    '33333333-0003-4000-8000-000000000007',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    2,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000008',
    '33333333-0003-4000-8000-000000000008',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    10,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000009',
    '33333333-0003-4000-8000-000000000009',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    4,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  ),
  (
    'aaaaaaaa-0001-4000-8000-00000000000a',
    '33333333-0003-4000-8000-00000000000a',
    '44444444-0004-4000-8000-000000000001',
    null,
    'entrada',
    6,
    'Existencia inicial',
    timestamptz '2026-11-18 10:00:00-06'
  );

-- Salidas del cobro. La venta abierta 1003 no genera movimiento.
insert into public.movimientos_inventario (
  id,
  producto_id,
  caja_id,
  venta_id,
  tipo,
  cantidad,
  nota,
  created_at
) values
  (
    'aaaaaaaa-0002-4000-8000-000000000001',
    '33333333-0003-4000-8000-000000000001',
    '44444444-0004-4000-8000-000000000001',
    '66666666-0006-4000-8000-000000000001',
    'salida_venta',
    2,
    'Cobro folio 1001',
    timestamptz '2026-11-18 12:15:00-06'
  ),
  (
    'aaaaaaaa-0002-4000-8000-000000000002',
    '33333333-0003-4000-8000-000000000004',
    '44444444-0004-4000-8000-000000000001',
    '66666666-0006-4000-8000-000000000001',
    'salida_venta',
    1,
    'Cobro folio 1001',
    timestamptz '2026-11-18 12:15:00-06'
  ),
  (
    'aaaaaaaa-0002-4000-8000-000000000003',
    '33333333-0003-4000-8000-000000000005',
    '44444444-0004-4000-8000-000000000001',
    '66666666-0006-4000-8000-000000000001',
    'salida_venta',
    1,
    'Cobro folio 1001',
    timestamptz '2026-11-18 12:15:00-06'
  ),
  (
    'aaaaaaaa-0002-4000-8000-000000000004',
    '33333333-0003-4000-8000-000000000002',
    '44444444-0004-4000-8000-000000000001',
    '66666666-0006-4000-8000-000000000002',
    'salida_venta',
    1,
    'Cobro folio 1002',
    timestamptz '2026-11-18 13:05:00-06'
  );

-- Devuelve la pizza del folio 1002. Misma cantidad que su salida_venta.
insert into public.movimientos_inventario (
  id,
  producto_id,
  caja_id,
  venta_id,
  tipo,
  cantidad,
  nota,
  created_at
) values
  (
    'aaaaaaaa-0003-4000-8000-000000000001',
    '33333333-0003-4000-8000-000000000002',
    '44444444-0004-4000-8000-000000000001',
    '66666666-0006-4000-8000-000000000002',
    'cancelacion',
    1,
    'Cancelación folio 1002',
    timestamptz '2026-11-18 13:20:00-06'
  );
