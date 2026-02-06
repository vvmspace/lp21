#!/usr/bin/env bash
set -euo pipefail

docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.test.yml down
