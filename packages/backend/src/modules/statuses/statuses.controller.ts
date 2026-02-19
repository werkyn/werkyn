import type { FastifyRequest, FastifyReply } from "fastify";
import * as statusesService from "./statuses.service.js";
import type {
  CreateStatusColumnInput,
  UpdateStatusColumnInput,
  ReorderInput,
} from "@pm/shared";

export async function listStatusesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const statuses = await statusesService.listStatuses(
    request.server.prisma,
    params.pid,
  );
  return reply.send({ data: statuses });
}

export async function createStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const body = request.body as CreateStatusColumnInput;
  const status = await statusesService.createStatus(
    request.server.prisma,
    params.pid,
    body,
  );
  request.server.broadcast(params.pid, "status_created", { statusId: status.id });
  return reply.status(201).send({ data: status });
}

export async function updateStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string; id: string };
  const body = request.body as UpdateStatusColumnInput;
  const status = await statusesService.updateStatus(
    request.server.prisma,
    params.pid,
    params.id,
    body,
  );
  request.server.broadcast(params.pid, "status_updated", { statusId: status.id });
  return reply.send({ data: status });
}

export async function deleteStatusHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string; id: string };
  await statusesService.deleteStatus(
    request.server.prisma,
    params.pid,
    params.id,
  );
  request.server.broadcast(params.pid, "status_deleted", { statusId: params.id });
  return reply.status(204).send();
}

export async function reorderStatusesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const body = request.body as ReorderInput;
  const statuses = await statusesService.reorderStatuses(
    request.server.prisma,
    params.pid,
    body,
  );
  request.server.broadcast(params.pid, "status_updated", { reordered: true });
  return reply.send({ data: statuses });
}
