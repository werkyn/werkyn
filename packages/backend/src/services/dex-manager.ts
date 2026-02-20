import { spawn, type ChildProcess } from "node:child_process";
import type { PrismaClient } from "@prisma/client";
import type { FastifyBaseLogger } from "fastify";
import { env } from "../config/env.js";
import { generateDexConfig } from "./dex-config.js";

class DexManager {
  private process: ChildProcess | null = null;
  private logger: FastifyBaseLogger | null = null;
  private restarting = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  get isRunning(): boolean {
    return this.process !== null && this.process.exitCode === null;
  }

  async start(prisma: PrismaClient, logger: FastifyBaseLogger): Promise<void> {
    this.logger = logger;

    const canStart = await this.canStart(prisma);
    if (!canStart) {
      logger.info("SSO not enabled or no connectors — Dex will not start");
      return;
    }

    await this.spawnProcess(prisma);
  }

  async restart(prisma: PrismaClient): Promise<void> {
    if (this.restarting) return;
    this.restarting = true;

    try {
      await this.stop();

      const canStart = await this.canStart(prisma);
      if (!canStart) {
        this.logger?.info("SSO not enabled or no connectors — Dex stopped");
        return;
      }

      await this.spawnProcess(prisma);
    } finally {
      this.restarting = false;
    }
  }

  async stop(): Promise<void> {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (!this.process) return;

    const proc = this.process;
    this.process = null;

    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        proc.kill("SIGKILL");
        resolve();
      }, 5000);

      proc.once("exit", () => {
        clearTimeout(timeout);
        resolve();
      });

      proc.kill("SIGTERM");
    });
  }

  private async canStart(prisma: PrismaClient): Promise<boolean> {
    const config = await prisma.ssoConfig.findUnique({
      where: { id: "singleton" },
      include: { connectors: { where: { enabled: true } } },
    });

    return !!config?.enabled && config.connectors.length > 0;
  }

  private async spawnProcess(prisma: PrismaClient): Promise<void> {
    let configPath: string;
    try {
      configPath = await generateDexConfig(prisma);
    } catch (err) {
      this.logger?.error(err, "Failed to generate Dex config");
      return;
    }

    this.logger?.info("Starting Dex process...");

    const proc = spawn(env.DEX_BINARY_PATH, ["serve", configPath], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env },
    });

    proc.stdout?.on("data", (data: Buffer) => {
      this.logger?.info({ dex: true }, data.toString().trim());
    });

    proc.stderr?.on("data", (data: Buffer) => {
      this.logger?.warn({ dex: true }, data.toString().trim());
    });

    proc.on("exit", (code, signal) => {
      if (this.process === proc) {
        this.logger?.warn(
          `Dex exited unexpectedly (code=${code}, signal=${signal}), restarting in 2s...`,
        );
        this.process = null;
        this.restartTimer = setTimeout(() => {
          this.spawnProcess(prisma).catch((err) => {
            this.logger?.error(err, "Failed to restart Dex");
          });
        }, 2000);
      }
    });

    this.process = proc;
  }
}

export const dexManager = new DexManager();
