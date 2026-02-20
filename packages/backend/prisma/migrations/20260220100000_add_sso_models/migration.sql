-- AlterTable: make passwordHash nullable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AuthProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "providerSub" VARCHAR(255),
    "connectorId" VARCHAR(100),
    "email" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SsoConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "passwordLoginEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoLinkByEmail" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SsoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SsoConnector" (
    "id" TEXT NOT NULL,
    "ssoConfigId" TEXT NOT NULL DEFAULT 'singleton',
    "connectorId" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "config" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SsoConnector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OidcState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "returnUrl" VARCHAR(500),
    "connectorId" VARCHAR(100),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OidcState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthProvider_userId_idx" ON "AuthProvider"("userId");
CREATE INDEX "AuthProvider_provider_email_idx" ON "AuthProvider"("provider", "email");
CREATE UNIQUE INDEX "AuthProvider_provider_providerSub_key" ON "AuthProvider"("provider", "providerSub");

-- CreateIndex
CREATE UNIQUE INDEX "SsoConnector_connectorId_key" ON "SsoConnector"("connectorId");
CREATE INDEX "SsoConnector_ssoConfigId_idx" ON "SsoConnector"("ssoConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "OidcState_state_key" ON "OidcState"("state");
CREATE INDEX "OidcState_expiresAt_idx" ON "OidcState"("expiresAt");

-- AddForeignKey
ALTER TABLE "AuthProvider" ADD CONSTRAINT "AuthProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SsoConnector" ADD CONSTRAINT "SsoConnector_ssoConfigId_fkey" FOREIGN KEY ("ssoConfigId") REFERENCES "SsoConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed singleton SsoConfig row
INSERT INTO "SsoConfig" ("id", "enabled", "passwordLoginEnabled", "autoLinkByEmail", "createdAt", "updatedAt")
VALUES ('singleton', false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Create AuthProvider records for existing users with passwords
INSERT INTO "AuthProvider" ("id", "userId", "provider", "email", "createdAt")
SELECT
  gen_random_uuid()::text,
  "id",
  'password',
  "email",
  CURRENT_TIMESTAMP
FROM "User"
WHERE "passwordHash" IS NOT NULL;
