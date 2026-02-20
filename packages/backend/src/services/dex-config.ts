import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { stringify } from "yaml";
import type { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

interface DexConfig {
  issuer: string;
  storage: Record<string, unknown>;
  web: { http: string };
  oauth2: { skipApprovalScreen: boolean };
  staticClients: Array<{
    id: string;
    name: string;
    redirectURIs: string[];
    secret: string;
  }>;
  connectors: Array<{
    type: string;
    id: string;
    name: string;
    config: Record<string, unknown>;
  }>;
}

export async function generateDexConfig(prisma: PrismaClient): Promise<string> {
  const ssoConfig = await prisma.ssoConfig.findUnique({
    where: { id: "singleton" },
    include: { connectors: { where: { enabled: true }, orderBy: { position: "asc" } } },
  });

  if (!ssoConfig || !ssoConfig.enabled || ssoConfig.connectors.length === 0) {
    throw new Error("SSO is not enabled or no connectors configured");
  }

  const storage: Record<string, unknown> =
    env.DEX_STORAGE_TYPE === "postgres"
      ? { type: "postgres", config: { host: env.DATABASE_URL } }
      : { type: "sqlite3", config: { file: path.join(env.DEX_CONFIG_DIR, "dex.db") } };

  const dexConfig: DexConfig = {
    issuer: `${env.FRONTEND_URL}/dex`,
    storage,
    web: { http: `127.0.0.1:${env.DEX_INTERNAL_PORT}` },
    oauth2: { skipApprovalScreen: true },
    staticClients: [
      {
        id: "werkyn",
        name: "Werkyn",
        redirectURIs: [`${env.FRONTEND_URL}/api/auth/oidc/callback`],
        secret: env.JWT_SECRET,
      },
    ],
    connectors: ssoConfig.connectors.map((c) => ({
      type: c.type,
      id: c.connectorId,
      name: c.name,
      config: c.config as Record<string, unknown>,
    })),
  };

  await mkdir(env.DEX_CONFIG_DIR, { recursive: true });
  const configPath = path.join(env.DEX_CONFIG_DIR, "dex-config.yaml");
  await writeFile(configPath, stringify(dexConfig), "utf-8");

  return configPath;
}
