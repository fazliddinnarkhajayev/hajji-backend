#!/bin/sh
set -e

echo "▶ Running database migrations..."
node_modules/.bin/knex migrate:latest --knexfile knexfile.production.js
echo "✔ Migrations complete."

echo "▶ Starting application..."
exec node dist/main
