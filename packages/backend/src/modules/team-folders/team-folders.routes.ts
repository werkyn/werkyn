import type { FastifyInstance } from "fastify";
import {
  createTeamFolderHandler,
  listTeamFoldersHandler,
  getTeamFolderHandler,
  updateTeamFolderHandler,
  deleteTeamFolderHandler,
  addMemberHandler,
  removeMemberHandler,
  addGroupHandler,
  removeGroupHandler,
} from "./team-folders.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import {
  CreateTeamFolderSchema,
  UpdateTeamFolderSchema,
  AddTeamFolderMemberSchema,
  AddTeamFolderGroupSchema,
} from "@pm/shared";

export default async function teamFoldersRoutes(fastify: FastifyInstance) {
  // POST /api/workspaces/:wid/team-folders — Create team folder (admin only)
  fastify.route({
    method: "POST",
    url: "/workspaces/:wid/team-folders",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(CreateTeamFolderSchema),
    ],
    handler: createTeamFolderHandler,
  });

  // GET /api/workspaces/:wid/team-folders — List team folders
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/team-folders",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: listTeamFoldersHandler,
  });

  // GET /api/workspaces/:wid/team-folders/:tfid — Get team folder detail
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/team-folders/:tfid",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: getTeamFolderHandler,
  });

  // PATCH /api/workspaces/:wid/team-folders/:tfid — Update team folder (admin only)
  fastify.route({
    method: "PATCH",
    url: "/workspaces/:wid/team-folders/:tfid",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(UpdateTeamFolderSchema),
    ],
    handler: updateTeamFolderHandler,
  });

  // DELETE /api/workspaces/:wid/team-folders/:tfid — Delete team folder (admin only)
  fastify.route({
    method: "DELETE",
    url: "/workspaces/:wid/team-folders/:tfid",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: deleteTeamFolderHandler,
  });

  // POST /api/workspaces/:wid/team-folders/:tfid/members — Add member (admin only)
  fastify.route({
    method: "POST",
    url: "/workspaces/:wid/team-folders/:tfid/members",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(AddTeamFolderMemberSchema),
    ],
    handler: addMemberHandler,
  });

  // DELETE /api/workspaces/:wid/team-folders/:tfid/members/:uid — Remove member (admin only)
  fastify.route({
    method: "DELETE",
    url: "/workspaces/:wid/team-folders/:tfid/members/:uid",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: removeMemberHandler,
  });

  // POST /api/workspaces/:wid/team-folders/:tfid/groups — Add group (admin only)
  fastify.route({
    method: "POST",
    url: "/workspaces/:wid/team-folders/:tfid/groups",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(AddTeamFolderGroupSchema),
    ],
    handler: addGroupHandler,
  });

  // DELETE /api/workspaces/:wid/team-folders/:tfid/groups/:gid — Remove group (admin only)
  fastify.route({
    method: "DELETE",
    url: "/workspaces/:wid/team-folders/:tfid/groups/:gid",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: removeGroupHandler,
  });
}
