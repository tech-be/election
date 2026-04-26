#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found"
  exit 1
fi

if [[ ! -f "$ROOT_DIR/docker-compose.prod.yml" ]]; then
  echo "docker-compose.prod.yml not found in repo root"
  exit 1
fi

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo ".env not found. Create it in repo root before starting production."
  exit 1
fi

echo "==> Starting production stack (docker-compose.prod.yml)"
docker compose -f docker-compose.prod.yml up -d --build

echo "==> Running DB migrations (alembic upgrade head)"
docker compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

echo "==> Health check"
set +e
curl -fsS "https://${DOMAIN:-}/api/health" >/dev/null 2>&1
RC=$?
set -e
if [[ $RC -ne 0 ]]; then
  echo "WARN: health check failed. Check logs:"
  echo "  docker compose -f docker-compose.prod.yml logs -f --tail=200 backend"
else
  echo "OK: https://${DOMAIN}/api/health"
fi

echo "==> Done"

