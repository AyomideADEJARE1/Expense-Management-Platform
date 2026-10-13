#!/usr/bin/env sh
# Host-side health probe for the AWS EC2 deployment.
#
# Checks the public application and database health endpoints and the local
# Docker container state. Exits 0 when everything is healthy, 1 otherwise, so it
# can be run from cron or a systemd timer and its output or exit code forwarded
# to whatever alerting the team configures (see docs/monitoring.md).
#
# Usage:
#   APP_URL=https://expense-tracker.live ./scripts/healthcheck.sh
#
# Without APP_URL, the local Nginx entry point (http://localhost) is checked.

set -u

APP_URL="${APP_URL:-http://localhost}"
TIMEOUT="${HEALTHCHECK_TIMEOUT:-10}"
status=0

check() {
  label="$1"
  url="$2"
  if curl --fail --silent --show-error --max-time "$TIMEOUT" "$url" >/dev/null 2>&1; then
    echo "OK    $label $url"
  else
    echo "FAIL  $label $url"
    status=1
  fi
}

check "application" "${APP_URL}/api/health"
check "database"    "${APP_URL}/api/health/db"

if command -v docker >/dev/null 2>&1; then
  for name in expense-nginx expense-frontend expense-backend expense-postgres; do
    health=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$name" 2>/dev/null || echo "missing")
    if [ "$health" = "healthy" ]; then
      echo "OK    container $name ($health)"
    else
      echo "FAIL  container $name ($health)"
      status=1
    fi
  done
else
  echo "SKIP  docker not found; container checks not run"
fi

exit "$status"
