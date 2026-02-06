#!/usr/bin/env bash
set -euo pipefail

docker compose -f docker-compose.dev.yml down --remove-orphans --volumes
cd - >/dev/null || true

docker compose -f docker-compose.prod.yml down --remove-orphans --volumes
cd - >/dev/null || true

docker compose -f docker-compose.test.yml down --remove-orphans --volumes
