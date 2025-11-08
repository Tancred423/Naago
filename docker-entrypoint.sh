#!/bin/bash
set -e

echo "Running database migrations..."
deno run --allow-all --unstable-detect-cjs database/migrate.ts
exec deno run --allow-all --unstable-detect-cjs index.ts
