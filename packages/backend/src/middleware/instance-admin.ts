import type { FastifyRequest, FastifyReply } from "fastify";
import { ForbiddenError } from "../utils/errors.js";

export async function instanceAdmin(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    throw new ForbiddenError("Authentication required");
  }

  const user = await request.server.prisma.user.findUnique({
    where: { id: request.user.id },
    select: { isInstanceAdmin: true },
  });

  if (!user?.isInstanceAdmin) {
    throw new ForbiddenError("Instance admin access required");
  }
}
