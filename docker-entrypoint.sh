#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/backend
prisma migrate deploy

echo "Starting server..."
exec node /app/packages/backend/dist/server.js
