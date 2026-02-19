import type { FastifyRequest, FastifyReply } from "fastify";
import * as labelsService from "./labels.service.js";
import type { CreateLabelInput, UpdateLabelInput } from "@pm/shared";

export async function listLabelsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const labels = await labelsService.listLabels(
    request.server.prisma,
    params.pid,
  );
  return reply.send({ data: labels });
}

export async function createLabelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const body = request.body as CreateLabelInput;
  const label = await labelsService.createLabel(
    request.server.prisma,
    params.pid,
    body,
  );
  return reply.status(201).send({ data: label });
}

export async function updateLabelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string; id: string };
  const body = request.body as UpdateLabelInput;
  const label = await labelsService.updateLabel(
    request.server.prisma,
    params.pid,
    params.id,
    body,
  );
  return reply.send({ data: label });
}

export async function deleteLabelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string; id: string };
  await labelsService.deleteLabel(
    request.server.prisma,
    params.pid,
    params.id,
  );
  return reply.status(204).send();
}
