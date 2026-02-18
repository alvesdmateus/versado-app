#!/usr/bin/env bash
# Create the test database if it doesn't exist
set -e

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5433}"
PGUSER="${PGUSER:-postgres}"
PGPASSWORD="${PGPASSWORD:-postgres}"

export PGPASSWORD

echo "Creating versado_test database..."
psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -tc \
  "SELECT 1 FROM pg_database WHERE datname = 'versado_test'" | grep -q 1 || \
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -c "CREATE DATABASE versado_test"

echo "Running migrations on versado_test..."
DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/versado_test" \
  bun run src/db/migrate.ts

echo "Test database ready."
