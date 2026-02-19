import type { PrismaClient } from "@prisma/client";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    broadcast: (projectId: string, event: string, data: unknown, excludeUserId?: string) => void;
    broadcastToWorkspace: (workspaceId: string, event: string, data: unknown, excludeUserId?: string) => void;
    broadcastToUser: (userId: string, event: string, data: unknown) => void;
  }

  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
      emailVerified: boolean;
    };
    workspaceMember?: {
      id: string;
      userId: string;
      workspaceId: string;
      role: "ADMIN" | "MEMBER" | "VIEWER";
    };
  }
}
