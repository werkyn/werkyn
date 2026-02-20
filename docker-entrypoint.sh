#!/bin/sh
set -e

echo "Preparing data directories..."
mkdir -p /app/data/dex

echo "Running database migrations..."
cd /app/packages/backend
prisma migrate deploy

echo "Starting server..."
cd /app
exec node /app/packages/backend/dist/server.js
