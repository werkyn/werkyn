# ── Stage 1: base ────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ── Stage 2: deps ────────────────────────────────────────────────
FROM base AS deps
# Copy package manifests and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
# Copy tsconfig files needed for build
COPY tsconfig.base.json ./
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/backend/tsconfig.json packages/backend/
COPY packages/frontend/tsconfig.json packages/frontend/
# Copy Prisma schema (needed for postinstall generate)
COPY packages/backend/prisma packages/backend/prisma/
# Install all dependencies (including devDependencies for building)
RUN pnpm install --frozen-lockfile

# ── Stage 3: build ───────────────────────────────────────────────
FROM deps AS build
# Copy all source code
COPY packages/shared/src packages/shared/src/
COPY packages/backend/src packages/backend/src/
COPY packages/frontend/ packages/frontend/
# Build: shared → backend → frontend
RUN pnpm build

# ── Stage 4: production ─────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

# Copy package manifests and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/

# Copy Prisma schema and migrations (needed for generate + migrate deploy)
COPY packages/backend/prisma packages/backend/prisma/

# Install production dependencies only (prisma generate won't run without CLI)
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Install prisma CLI globally for runtime migrations and generate
RUN pnpm add -g prisma

# Generate Prisma client for linux-musl (Alpine)
RUN cd packages/backend && prisma generate

# Copy built artifacts from build stage
COPY --from=build /app/packages/shared/dist packages/shared/dist/
COPY --from=build /app/packages/backend/dist packages/backend/dist/
COPY --from=build /app/packages/frontend/dist packages/frontend/dist/

# Create storage directory
RUN mkdir -p /app/storage

# Copy and set up entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
