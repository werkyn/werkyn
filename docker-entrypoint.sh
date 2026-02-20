#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/backend
prisma migrate deploy

echo "Starting server..."
cd /app
exec node /app/packages/backend/dist/server.js
