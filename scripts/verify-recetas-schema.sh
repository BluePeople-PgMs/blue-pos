#!/usr/bin/env bash
# Verifica que la migración 20261118150000_recetas_fkeys esté aplicada en el proyecto Supabase.
# Requiere .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
# No escribe datos permanentes: crea, prueba unicidad y borra.

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
TS=$(date +%s)
fail=0

ok() { echo "PASS: $1"; }
bad() { echo "FAIL: $1 — $2"; fail=1; }

code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$base/categorias?select=id&limit=1" "${hdr[@]}")
[[ "$code" == "200" ]] && ok "conexión API" || bad "conexión API" "HTTP $code"

PREP_JSON=$(curl -s --max-time 20 -X POST "$base/productos" \
  "${hdr[@]}" -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"nombre\":\"PrepVerify-$TS\",\"tipo\":\"preparado\",\"activo\":true}")
PREP_ID=$(node -pe "JSON.parse(process.argv[1])[0]?.id||''" "$PREP_JSON")
[[ -n "$PREP_ID" ]] && ok "crear preparado prueba" || bad "crear preparado prueba" "$PREP_JSON"

INS_JSON=$(curl -s --max-time 20 -X POST "$base/productos" \
  "${hdr[@]}" -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"nombre\":\"InsumoVerify-$TS\",\"tipo\":\"insumo\",\"activo\":true}")
INS_ID=$(node -pe "JSON.parse(process.argv[1])[0]?.id||''" "$INS_JSON")
[[ -n "$INS_ID" ]] && ok "crear insumo prueba" || bad "crear insumo prueba" "$INS_JSON"

REC_JSON=$(curl -s --max-time 20 -w "\n%{http_code}" -X POST "$base/recetas" \
  "${hdr[@]}" -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"producto_id\":\"$PREP_ID\",\"nombre\":\"Verify-$TS\",\"rendimiento\":1}")
REC_CODE=$(echo "$REC_JSON" | tail -n1)
REC_BODY=$(echo "$REC_JSON" | sed '$d')
REC_ID=$(node -pe "try{JSON.parse(process.argv[1])[0]?.id||''}catch(e){''}" "$REC_BODY")
if [[ "$REC_CODE" == "201" && -n "$REC_ID" ]]; then
  ok "crear receta"
else
  bad "crear receta" "$REC_BODY"
fi

if [[ -n "$REC_ID" ]]; then
  DUP_CODE=$(curl -s -o /tmp/dup_rec.json -w "%{http_code}" --max-time 20 -X POST "$base/recetas" \
    "${hdr[@]}" -H "Content-Type: application/json" \
    -d "{\"producto_id\":\"$PREP_ID\",\"nombre\":\"Dup\",\"rendimiento\":1}")
  if [[ "$DUP_CODE" == "409" || "$DUP_CODE" == "400" ]]; then
    ok "único recetas.producto_id"
  else
    bad "único recetas.producto_id" "HTTP $DUP_CODE (aplicar supabase/migrations/20261118150000_recetas_fkeys.sql)"
  fi

  curl -s --max-time 20 -X POST "$base/receta_insumos" \
    "${hdr[@]}" -H "Content-Type: application/json" \
    -d "{\"receta_id\":\"$REC_ID\",\"insumo_id\":\"$INS_ID\",\"cantidad\":1}" >/dev/null

  RI_DUP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 -X POST "$base/receta_insumos" \
    "${hdr[@]}" -H "Content-Type: application/json" \
    -d "{\"receta_id\":\"$REC_ID\",\"insumo_id\":\"$INS_ID\",\"cantidad\":1}")
  if [[ "$RI_DUP" == "409" || "$RI_DUP" == "400" ]]; then
    ok "único receta_insumos (receta_id, insumo_id)"
  else
    bad "único receta_insumos" "HTTP $RI_DUP (misma migración)"
  fi

  JOIN_CODE=$(curl -s -o /tmp/join.json -w "%{http_code}" --max-time 20 \
    "$base/receta_insumos?receta_id=eq.$REC_ID&select=id,productos!receta_insumos_insumo_id_fkey(nombre)" \
    "${hdr[@]}")
  if [[ "$JOIN_CODE" == "200" ]]; then
    ok "embed FK receta_insumos_insumo_id_fkey"
  else
    bad "embed FK" "HTTP $JOIN_CODE $(head -c 200 /tmp/join.json)"
  fi
fi

# Limpieza
[[ -n "$PREP_ID" ]] && curl -s --max-time 20 -X DELETE "$base/productos?id=eq.$PREP_ID" "${hdr[@]}" >/dev/null
[[ -n "$INS_ID" ]] && curl -s --max-time 20 -X DELETE "$base/productos?id=eq.$INS_ID" "${hdr[@]}" >/dev/null

echo "---"
if [[ "$fail" -eq 0 ]]; then
  echo "Migración de recetas: OK en remoto"
  exit 0
fi
echo "Falta aplicar 20261118150000_recetas_fkeys.sql en el SQL Editor de Supabase (proyecto blue-pos)."
exit 1