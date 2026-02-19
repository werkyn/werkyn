import type { FastifyRequest, FastifyReply } from "fastify";
import * as groupsService from "./groups.service.js";
import type { CreateGroupInput, UpdateGroupInput, AddGroupMemberInput } from "@pm/shared";

export async function createGroupHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const body = request.body as CreateGroupInput;

  const group = await groupsService.createGroup(
    request.server.prisma,
    params.wid,
    body,
  );

  return reply.status(201).send({ data: group });
}

export async function listGroupsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };

  const groups = await groupsService.listGroups(
    request.server.prisma,
    params.wid,
  );

  return reply.send({ data: groups });
}

export async function getGroupHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; gid: string };

  const group = await groupsService.getGroup(
    request.server.prisma,
    params.wid,
    params.gid,
  );

  return reply.send({ data: group });
}

export async function updateGroupHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; gid: string };
  const body = request.body as UpdateGroupInput;

  const group = await groupsService.updateGroup(
    request.server.prisma,
    params.wid,
    params.gid,
    body,
  );

  return reply.send({ data: group });
}

export async function deleteGroupHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; gid: string };

  await groupsService.deleteGroup(
    request.server.prisma,
    params.wid,
    params.gid,
  );

  return reply.status(204).send();
}

export async function addMemberHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; gid: string };
  const body = request.body as AddGroupMemberInput;

  const member = await groupsService.addMember(
    request.server.prisma,
    params.wid,
    params.gid,
    body.userId,
  );

  return reply.status(201).send({ data: member });
}

export async function removeMemberHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string; gid: string; uid: string };

  await groupsService.removeMember(
    request.server.prisma,
    params.wid,
    params.gid,
    params.uid,
  );

  return reply.status(204).send();
}
