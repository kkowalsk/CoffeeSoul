#!/usr/bin/env bash
#
# Mirrors poc/source/poc.py init() against the REST API instead of the DB
# directly:
#   1. seed the brews   (from db-seeding/seedData/brews.json)
#   2. seed the comrades (from db-seeding/seedData/comrades.json)
#   3. process the first N orders (from api/seedData/orders_mixed.json)
#      -- each order becomes a procurement plus its line items.
#
# poc.py additionally assigns each procurement a payee via
# SmoothWeightedRoundRobin. That logic is intentionally NOT exposed by the API,
# so "processing" here means persisting the procurement and its line items;
# payee is left null.
#
# The API generates UUIDs server-side, so ids can't be hardcoded -- the script
# captures them from each POST response into name->id maps (the analog of
# poc.py's brewsByName / comradesByName) and uses them for the FK references.
#
# Usage:  ./seed_and_process_orders.sh
#         BASE_URL=http://host:port/api/v1 NUM_ORDERS=10 ./seed_and_process_orders.sh
#
# Requires: jq, curl.
#
# Note: brew/comrade names are UNIQUE, so re-running against an already-seeded
# db will 409 on the brew/comrade POSTs. Start from a fresh db to re-run.

set -euo pipefail

command -v jq >/dev/null   || { echo "jq is required but not installed" >&2; exit 1; }
command -v curl >/dev/null || { echo "curl is required but not installed" >&2; exit 1; }

BASE_URL="${BASE_URL:-http://localhost:8081/api/v1}"
NUM_ORDERS="${NUM_ORDERS:-10}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BREWS_JSON="$SCRIPT_DIR/db-seeding/seedData/brews.json"
COMRADES_JSON="$SCRIPT_DIR/db-seeding/seedData/comrades.json"
ORDERS_JSON="$SCRIPT_DIR/api/seedData/orders_mixed.json"

# name -> uuid maps, populated from POST responses
declare -A BREW_ID
declare -A COMRADE_ID

echo "== seeding brews =="
# each brew object in the seed file is already exactly the POST body
while IFS= read -r body; do
    name=$(printf '%s' "$body" | jq -r '.name')
    id=$(curl -sf -X POST "$BASE_URL/brews" \
            -H 'Content-Type: application/json' -d "$body" | jq -r '.id')
    BREW_ID["$name"]="$id"
    echo "  brew $name -> $id"
done < <(jq -c '.[]' "$BREWS_JSON")

echo "== seeding comrades =="
while IFS= read -r line; do
    name=$(printf '%s' "$line" | jq -r '.name')
    brew_name=$(printf '%s' "$line" | jq -r '.defaultBrewId')   # seed file stores the brew *name* here
    body=$(jq -n --arg name "$name" --arg brewId "${BREW_ID[$brew_name]}" \
            '{name: $name, defaultBrewId: $brewId}')
    id=$(curl -sf -X POST "$BASE_URL/coffee-comrades" \
            -H 'Content-Type: application/json' -d "$body" | jq -r '.id')
    COMRADE_ID["$name"]="$id"
    echo "  comrade $name -> $id"
done < <(jq -c '.[]' "$COMRADES_JSON")

echo "== processing first $NUM_ORDERS orders =="
order_num=0
while IFS= read -r order_json; do
    order_num=$((order_num + 1))

    # create the procurement (timestamp defaults to now(), payee left null)
    pid=$(curl -sf -X POST "$BASE_URL/procurements" \
            -H 'Content-Type: application/json' -d '{}' | jq -r '.id')

    # add each line item, translating comrade/brew names to their ids
    while IFS=$'\t' read -r comrade_name brew_name; do
        body=$(jq -n \
                --arg p "$pid" \
                --arg c "${COMRADE_ID[$comrade_name]}" \
                --arg b "${BREW_ID[$brew_name]}" \
                '{procurementId: $p, comradeId: $c, brewId: $b}')
        curl -sf -X POST "$BASE_URL/line-items" \
            -H 'Content-Type: application/json' -d "$body" >/dev/null
    done < <(printf '%s' "$order_json" | jq -r '.lineItems[] | [.comradeName, .brewName] | @tsv')

    total=$(curl -sf "$BASE_URL/procurements/$pid/total" | jq -r '.total')
    echo "  order $order_num: procurement $pid total \$$total"
done < <(jq -c ".[0:$NUM_ORDERS][]" "$ORDERS_JSON")

echo "== done: seeded ${#BREW_ID[@]} brews, ${#COMRADE_ID[@]} comrades, processed $NUM_ORDERS orders =="
