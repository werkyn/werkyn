import type { FastifyRequest, FastifyReply } from "fastify";
import { ForbiddenError } from "../utils/errors.js";

export async function instanceAdmin(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    throw new ForbiddenError("Authentication required");
  }

  const adminMembership = await request.server.prisma.workspaceMember.findFirst(
    {
      where: {
        userId: request.user.id,
        role: "ADMIN",
      },
    },
  );

  if (!adminMembership) {
    throw new ForbiddenError(
      "Instance admin access required (must be admin of at least one workspace)",
    );
  }
}
