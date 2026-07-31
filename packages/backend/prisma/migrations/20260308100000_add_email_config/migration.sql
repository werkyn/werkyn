-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "host" VARCHAR(255) NOT NULL DEFAULT '',
    "port" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "user" VARCHAR(255) NOT NULL DEFAULT '',
    "pass" VARCHAR(500) NOT NULL DEFAULT '',
    "fromAddress" VARCHAR(255) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("id")
);
