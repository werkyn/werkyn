import type { FastifyRequest, FastifyReply } from "fastify";
import type { CreateInviteInput } from "@pm/shared";
import * as invitesService from "./invites.service.js";

export async function createInviteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const body = request.body as CreateInviteInput;
  const invite = await invitesService.createInvite(
    request.server.prisma,
    params.wid,
    body,
  );
  return reply.status(201).send({ data: invite });
}

export async function listInvitesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const invites = await invitesService.listInvites(
    request.server.prisma,
    params.wid,
  );
  return reply.send({ data: invites });
}

export async function revokeInviteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { id: string };
  // Need to look up the invite to get its workspaceId for admin check
  const invite = await request.server.prisma.workspaceInvite.findUnique({
    where: { id: params.id },
    select: { workspaceId: true },
  });

  if (!invite) {
    return reply.status(404).send({
      statusCode: 404,
      error: "Not Found",
      message: "Invite not found",
    });
  }

  // Verify the current user is an admin of this workspace
  const member = await request.server.prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: request.user!.id,
        workspaceId: invite.workspaceId,
      },
    },
  });

  if (!member || member.role !== "ADMIN") {
    return reply.status(403).send({
      statusCode: 403,
      error: "Forbidden",
      message: "Only admins can revoke invites",
    });
  }

  await invitesService.revokeInvite(
    request.server.prisma,
    params.id,
    invite.workspaceId,
  );
  return reply.status(204).send();
}

export async function getInviteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { token: string };
  const invite = await invitesService.getInviteByToken(
    request.server.prisma,
    params.token,
  );
  return reply.send({ data: invite });
}

export async function acceptInviteHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { token: string };
  const workspace = await invitesService.acceptInvite(
    request.server.prisma,
    params.token,
    request.user!.id,
    request.user!.email,
  );
  return reply.send({ data: workspace });
}
