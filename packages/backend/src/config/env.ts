import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

  COOKIE_SECRET: z.string().min(1, "COOKIE_SECRET is required"),
  COOKIE_DOMAIN: z.string().default(""),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  FRONTEND_URL: z.string().default("http://localhost:5173"),

  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("noreply@example.com"),

  STORAGE_DIR: z.string().default("./storage"),
  MAX_FILE_SIZE: z.coerce.number().default(10737418240), // 10GB

  // Dex (embedded OIDC identity provider)
  DEX_BINARY_PATH: z.string().default("/usr/local/bin/dex"),
  DEX_CONFIG_DIR: z.string().default("/app/data/dex"),
  DEX_INTERNAL_PORT: z.coerce.number().default(5556),
  DEX_STORAGE_TYPE: z.enum(["sqlite3", "postgres"]).default("sqlite3"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
