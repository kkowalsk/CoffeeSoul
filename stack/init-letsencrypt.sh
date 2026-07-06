#!/usr/bin/env bash
#
# One-time bootstrap for the web service's Let's Encrypt certificate.
#
# nginx refuses to start with a `443 ssl` server block pointing at
# certificate files that don't exist, but the ACME HTTP-01 challenge needs
# nginx already running on port 80 to serve it. This script breaks that
# chicken-and-egg problem the standard way: write a throwaway self-signed
# cert so nginx can start, request the real one via the webroot challenge,
# then swap it in and reload. Renewal (cron, see bottom) never repeats this
# dance -- nginx stays up the whole time, serving the same webroot path it
# always does.
#
# Requires: DNS for $DOMAIN already pointing at this host, and the security
# group allowing inbound 80 + 443.
#
# Usage (from stack/):
#   ./init-letsencrypt.sh            request a real cert
#   STAGING=1 ./init-letsencrypt.sh  first dry run against LE's staging CA
#                                    (untrusted cert, but doesn't burn your
#                                    production rate limit while debugging)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

DOMAIN="coffeesoul.kowalski.nz"
EMAIL="kevin.d.kowalski@gmail.com"
STAGING="${STAGING:-0}"

compose() { docker compose -f "$COMPOSE_FILE" "$@"; }

echo "== creating dummy cert so nginx can start =="
compose run --rm --entrypoint sh certbot -c "
  mkdir -p /etc/letsencrypt/live/$DOMAIN &&
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout /etc/letsencrypt/live/$DOMAIN/privkey.pem \
    -out /etc/letsencrypt/live/$DOMAIN/fullchain.pem \
    -subj '/CN=localhost'
"

echo "== starting web with the dummy cert =="
compose up -d web

echo "== deleting dummy cert so certbot writes a real one in its place =="
compose run --rm --entrypoint sh certbot -c "
  rm -rf /etc/letsencrypt/live/$DOMAIN \
         /etc/letsencrypt/archive/$DOMAIN \
         /etc/letsencrypt/renewal/$DOMAIN.conf
"

STAGING_ARG=""
[ "$STAGING" = "1" ] && STAGING_ARG="--staging"

echo "== requesting certificate from Let's Encrypt =="
compose run --rm certbot certonly --webroot -w /var/www/certbot \
  $STAGING_ARG \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN"

echo "== reloading nginx with the real cert =="
compose exec web nginx -s reload

echo "== done: https://$DOMAIN/ =="

# --- Renewal ---------------------------------------------------------------
# certbot certs are valid 90 days. Add a host crontab entry (not in-container,
# since it needs to survive container recreation) to renew twice daily -- a
# no-op unless within ~30 days of expiry -- and reload nginx only if it
# actually renewed:
#
#   0 0,12 * * * cd /path/to/coffee_soul/stack && \
#     docker compose run --rm certbot renew --quiet && \
#     docker compose exec web nginx -s reload
