import type { FastifyInstance } from "fastify";
import {
  createProjectHandler,
  listProjectsHandler,
  getProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  archiveProjectHandler,
  listProjectMembersHandler,
  addProjectMemberHandler,
  removeProjectMemberHandler,
} from "./projects.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate, validateQuery } from "../../middleware/validate.js";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ArchiveSchema,
  ProjectQuerySchema,
  AddProjectMemberSchema,
} from "./projects.schemas.js";

export default async function projectsRoutes(fastify: FastifyInstance) {
  // POST /api/workspaces/:wid/projects
  fastify.route({
    method: "POST",
    url: "/workspaces/:wid/projects",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(CreateProjectSchema),
    ],
    handler: createProjectHandler,
  });

  // GET /api/workspaces/:wid/projects
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/projects",
    preHandler: [
      authenticate,
      authorize("ADMIN", "MEMBER", "VIEWER"),
      validateQuery(ProjectQuerySchema),
    ],
    handler: listProjectsHandler,
  });

  // GET /api/projects/:pid
  fastify.route({
    method: "GET",
    url: "/projects/:pid",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: getProjectHandler,
  });

  // PATCH /api/projects/:pid
  fastify.route({
    method: "PATCH",
    url: "/projects/:pid",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(UpdateProjectSchema),
    ],
    handler: updateProjectHandler,
  });

  // DELETE /api/projects/:pid
  fastify.route({
    method: "DELETE",
    url: "/projects/:pid",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: deleteProjectHandler,
  });

  // PATCH /api/projects/:pid/archive
  fastify.route({
    method: "PATCH",
    url: "/projects/:pid/archive",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(ArchiveSchema),
    ],
    handler: archiveProjectHandler,
  });

  // GET /api/projects/:pid/members
  fastify.route({
    method: "GET",
    url: "/projects/:pid/members",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: listProjectMembersHandler,
  });

  // POST /api/projects/:pid/members
  fastify.route({
    method: "POST",
    url: "/projects/:pid/members",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(AddProjectMemberSchema),
    ],
    handler: addProjectMemberHandler,
  });

  // DELETE /api/projects/:pid/members/:uid
  fastify.route({
    method: "DELETE",
    url: "/projects/:pid/members/:uid",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: removeProjectMemberHandler,
  });
}
