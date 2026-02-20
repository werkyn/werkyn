import type { FastifyRequest, FastifyReply } from "fastify";
import * as ssoService from "./sso.service.js";
import { dexManager } from "../../services/dex-manager.js";
import { clearAuthServerCache } from "../auth/oidc/oidc.service.js";
import type { UpdateSsoConfigInput, CreateSsoConnectorInput, UpdateSsoConnectorInput } from "@pm/shared";

export async function getConfigHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const config = await ssoService.getSsoConfig(request.server.prisma);
  return reply.send({ data: config });
}

export async function updateConfigHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as UpdateSsoConfigInput;
  const config = await ssoService.updateSsoConfig(
    request.server.prisma,
    body,
  );

  // Restart Dex to pick up changes
  clearAuthServerCache();
  dexManager.restart(request.server.prisma).catch((err) => {
    request.server.log.error(err, "Failed to restart Dex after config update");
  });

  return reply.send({ data: config });
}

export async function getConnectorsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const connectors = await ssoService.getConnectors(request.server.prisma);
  return reply.send({ data: connectors });
}

export async function createConnectorHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = request.body as CreateSsoConnectorInput;
  const connector = await ssoService.createConnector(
    request.server.prisma,
    body,
  );

  clearAuthServerCache();
  dexManager.restart(request.server.prisma).catch((err) => {
    request.server.log.error(err, "Failed to restart Dex after connector create");
  });

  return reply.status(201).send({ data: connector });
}

export async function updateConnectorHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { cid: string };
  const body = request.body as UpdateSsoConnectorInput;
  const connector = await ssoService.updateConnector(
    request.server.prisma,
    params.cid,
    body,
  );

  clearAuthServerCache();
  dexManager.restart(request.server.prisma).catch((err) => {
    request.server.log.error(err, "Failed to restart Dex after connector update");
  });

  return reply.send({ data: connector });
}

export async function deleteConnectorHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { cid: string };
  await ssoService.deleteConnector(request.server.prisma, params.cid);

  clearAuthServerCache();
  dexManager.restart(request.server.prisma).catch((err) => {
    request.server.log.error(err, "Failed to restart Dex after connector delete");
  });

  return reply.status(204).send();
}
