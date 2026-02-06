#!/usr/bin/env bash
set -euo pipefail

./down.sh

volumes=$(docker volume ls -q | grep '_db_data$' || true)
if [ -n "$volumes" ]; then
  docker volume rm $volumes
fi
