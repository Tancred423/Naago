#!/bin/bash
set -e

echo "Running database migrations..."
deno run --allow-all --unstable-detect-cjs db/migrate.ts

if [ "$DEV_MODE" = "true" ]; then
  echo "Starting application in DEVELOPMENT mode with hot reloading..."
  echo "Using polling-based file watcher for Docker on Windows compatibility..."
  exec deno run --allow-all --unstable-detect-cjs dev-watch.ts
else
  echo "Starting application in PRODUCTION mode..."
  exec deno run --allow-all --unstable-detect-cjs index.ts
fi

