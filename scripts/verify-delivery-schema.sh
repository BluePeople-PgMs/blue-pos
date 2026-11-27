#!/usr/bin/env bash
# Verifica tablas, columnas, vista y RPCs del módulo delivery en Supabase.
# Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.

set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "FAIL: falta .env.local"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

hdr=(-H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
base="$NEXT_PUBLIC_SUPABASE_URL/rest/v1"
fail=0

ok() { echo "PASS: $1"; }
bad() { echo "FAIL: $1 — $2"; fail=1; }

code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$base/delivery_orders?select=id&limit=1" "${hdr[@]}")
[[ "$code" == "200" ]] && ok "tabla delivery_orders" || bad "tabla delivery_orders" "HTTP $code (aplicar migraciones delivery)"

code=$(curl -s -o /tmp/do_notes.json -w "%{http_code}" --max-time 20 \
  "$base/delivery_orders?select=delivery_notes&limit=0" "${hdr[@]}")
if [[ "$code" == "200" ]]; then
  ok "columna delivery_orders.delivery_notes"
else
  bad "columna delivery_notes" "HTTP $code $(head -c 200 /tmp/do_notes.json) (aplicar 20261127130000_delivery_enhancements.sql)"
fi

code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 \
  "$base/delivery_order_items?select=id&limit=1" "${hdr[@]}")
[[ "$code" == "200" ]] && ok "tabla delivery_order_items" || bad "tabla delivery_order_items" "HTTP $code"

code=$(curl -s -o /tmp/drv_view.json -w "%{http_code}" --max-time 20 \
  "$base/delivery_order_driver_display?select=order_id,driver_nombre&limit=0" "${hdr[@]}")
if [[ "$code" == "200" ]]; then
  ok "vista delivery_order_driver_display"
else
  bad "vista delivery_order_driver_display" "HTTP $code $(head -c 200 /tmp/drv_view.json)"
fi

RPCS=(
  delivery_crear_pedido
  delivery_iniciar_empaque
  delivery_toggle_item_packed
  delivery_cerrar_empaque
  delivery_iniciar_entrega
  delivery_finalizar
  delivery_calificar
)

for rpc in "${RPCS[@]}"; do
  rpc_code=$(curl -s -o /tmp/rpc_"$rpc".json -w "%{http_code}" --max-time 20 \
    -X POST "$base/rpc/$rpc" \
    "${hdr[@]}" -H "Content-Type: application/json" -d '{}')
  if [[ "$rpc_code" == "404" ]]; then
    bad "rpc $rpc" "no expuesta (revisar migraciones delivery)"
  else
    ok "rpc $rpc"
  fi
done

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "Esquema delivery: OK en remoto"
  exit 0
fi
echo "Falta aplicar migraciones delivery (27110000 … 27132000) en el SQL Editor"
echo "o con: npm run migrate:delivery"
exit 1