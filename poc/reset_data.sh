#!/usr/bin/env bash
#
# Clears all application data while keeping the Flyway-owned schema intact.
#
# TRUNCATEs every table in the public schema EXCEPT flyway_schema_history, so
# the tables/indexes/view and Flyway's migration state all survive -- only the
# rows go. CASCADE handles the FK order automatically.
#
# This is the data-only reset. It is deliberately NOT `flyway clean` (which
# drops the schema objects) or `docker compose down -v` (which drops the whole
# volume) -- both of those would destroy the schema too.
#
# Runs psql inside the db container as its own superuser over the local trust
# socket, so no host-side credentials are needed for the truncate.
#
# Usage:
#   ./reset_data.sh          truncate all data (schema preserved)
#   ./reset_data.sh --seed   truncate, then re-run database-seeding to
#                            repopulate the reference brews/comrades
#
# Requires: the db service to be up (docker compose up -d db).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

SEED=0
[ "${1:-}" = "--seed" ] && SEED=1

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

if [ -z "$(compose ps -q db 2>/dev/null)" ]; then
    echo "db service is not running -- start it first: docker compose up -d db" >&2
    exit 1
fi

echo "== truncating data (schema + flyway_schema_history preserved) =="
# quoted heredoc so bash leaves the DO block's $$ / format() untouched
compose exec -T db sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
DO $$
DECLARE t text;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename <> 'flyway_schema_history'
    LOOP
        EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', t);
        RAISE NOTICE 'truncated %', t;
    END LOOP;
END $$;
SQL
echo "== data cleared =="

if [ "$SEED" -eq 1 ]; then
    echo "== re-seeding reference data =="
    # the seeder is a separate container that authenticates over the network,
    # so it needs the real credentials -- pull them from the running db
    # container rather than requiring them in the caller's environment.
    U=$(compose exec -T db printenv POSTGRES_USER | tr -d '\r')
    P=$(compose exec -T db printenv POSTGRES_PASSWORD | tr -d '\r')
    POSTGRES_USER="$U" POSTGRES_PASSWORD="$P" compose run --rm database-seeding
fi
