#!/bin/bash
set -e

echo "Running database migrations..."
deno run --allow-all --unstable-detect-cjs db/migrate.ts

echo "Starting application..."
exec deno run --allow-all --unstable-detect-cjs index.ts

