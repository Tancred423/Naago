#!/bin/bash
set -e

echo "Running database migrations..."
deno run --allow-all database/migrate.ts
exec deno run --allow-all index.ts
