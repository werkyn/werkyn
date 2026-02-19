import type { FastifyRequest, FastifyReply } from "fastify";
import * as projectsService from "./projects.service.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ArchiveInput,
  ProjectQueryInput,
  AddProjectMemberInput,
} from "@pm/shared";

export async function createProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const body = request.body as CreateProjectInput;
  const project = await projectsService.createProject(
    request.server.prisma,
    params.wid,
    request.user!.id,
    body,
  );
  return reply.status(201).send({ data: project });
}

export async function listProjectsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { wid: string };
  const query = request.query as ProjectQueryInput;
  const result = await projectsService.listProjects(
    request.server.prisma,
    params.wid,
    request.user!.id,
    request.workspaceMember!.role,
    query,
  );
  return reply.send(result);
}

export async function getProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const project = await projectsService.getProject(
    request.server.prisma,
    params.pid,
    request.user!.id,
    request.workspaceMember!.role,
  );
  return reply.send({ data: project });
}

export async function updateProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const body = request.body as UpdateProjectInput;
  const project = await projectsService.updateProject(
    request.server.prisma,
    params.pid,
    body,
  );
  return reply.send({ data: project });
}

export async function deleteProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  await projectsService.deleteProject(request.server.prisma, params.pid);
  return reply.status(204).send();
}

export async function archiveProjectHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const body = request.body as ArchiveInput;
  const project = await projectsService.archiveProject(
    request.server.prisma,
    params.pid,
    body,
  );
  return reply.send({ data: project });
}

export async function listProjectMembersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const members = await projectsService.listProjectMembers(
    request.server.prisma,
    params.pid,
  );
  return reply.send({ data: members });
}

export async function addProjectMemberHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string };
  const body = request.body as AddProjectMemberInput;

  // authorize middleware already validated project exists via :pid
  const project = await request.server.prisma.project.findUnique({
    where: { id: params.pid },
    select: { workspaceId: true },
  });
  if (!project) {
    return reply.status(404).send({ statusCode: 404, error: "Not Found", message: "Project not found" });
  }

  const member = await projectsService.addProjectMember(
    request.server.prisma,
    params.pid,
    project.workspaceId,
    body,
  );
  return reply.status(201).send({ data: member });
}

export async function removeProjectMemberHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { pid: string; uid: string };
  await projectsService.removeProjectMember(
    request.server.prisma,
    params.pid,
    params.uid,
  );
  return reply.status(204).send();
}
