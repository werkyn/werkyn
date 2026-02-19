import type { FastifyInstance } from "fastify";
import {
  createGroupHandler,
  listGroupsHandler,
  getGroupHandler,
  updateGroupHandler,
  deleteGroupHandler,
  addMemberHandler,
  removeMemberHandler,
} from "./groups.controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validate } from "../../middleware/validate.js";
import {
  CreateGroupSchema,
  UpdateGroupSchema,
  AddGroupMemberSchema,
} from "@pm/shared";

export default async function groupsRoutes(fastify: FastifyInstance) {
  // POST /api/workspaces/:wid/groups — Create group (admin only)
  fastify.route({
    method: "POST",
    url: "/workspaces/:wid/groups",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(CreateGroupSchema),
    ],
    handler: createGroupHandler,
  });

  // GET /api/workspaces/:wid/groups — List groups
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/groups",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: listGroupsHandler,
  });

  // GET /api/workspaces/:wid/groups/:gid — Get group detail
  fastify.route({
    method: "GET",
    url: "/workspaces/:wid/groups/:gid",
    preHandler: [authenticate, authorize("ADMIN", "MEMBER", "VIEWER")],
    handler: getGroupHandler,
  });

  // PATCH /api/workspaces/:wid/groups/:gid — Update group (admin only)
  fastify.route({
    method: "PATCH",
    url: "/workspaces/:wid/groups/:gid",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(UpdateGroupSchema),
    ],
    handler: updateGroupHandler,
  });

  // DELETE /api/workspaces/:wid/groups/:gid — Delete group (admin only)
  fastify.route({
    method: "DELETE",
    url: "/workspaces/:wid/groups/:gid",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: deleteGroupHandler,
  });

  // POST /api/workspaces/:wid/groups/:gid/members — Add member (admin only)
  fastify.route({
    method: "POST",
    url: "/workspaces/:wid/groups/:gid/members",
    preHandler: [
      authenticate,
      authorize("ADMIN"),
      validate(AddGroupMemberSchema),
    ],
    handler: addMemberHandler,
  });

  // DELETE /api/workspaces/:wid/groups/:gid/members/:uid — Remove member (admin only)
  fastify.route({
    method: "DELETE",
    url: "/workspaces/:wid/groups/:gid/members/:uid",
    preHandler: [authenticate, authorize("ADMIN")],
    handler: removeMemberHandler,
  });
}
