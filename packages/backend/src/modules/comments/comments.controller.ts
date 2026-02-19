import type { FastifyRequest, FastifyReply } from "fastify";
import * as commentsService from "./comments.service.js";
import { notify } from "../../utils/notify.js";
import type { CreateCommentInput, UpdateCommentInput, CommentQueryInput } from "@pm/shared";

export async function listCommentsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { tid: string };
  const query = request.query as CommentQueryInput;
  const result = await commentsService.listComments(
    request.server.prisma,
    params.tid,
    query,
  );
  return reply.send(result);
}

export async function createCommentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { tid: string };
  const body = request.body as CreateCommentInput;
  const { comment, projectId, mentionedUserIds } = await commentsService.createComment(
    request.server.prisma,
    params.tid,
    request.user!.id,
    body,
  );
  request.server.broadcast(projectId, "comment_created", {
    taskId: params.tid,
    commentId: comment.id,
  });

  // Fetch task info for notifications
  const task = await request.server.prisma.task.findUnique({
    where: { id: params.tid },
    select: { title: true, assignees: { select: { userId: true } } },
  });
  if (task) {
    // Notify assignees about new comment (exclude mentioned users — they get a separate notification)
    const assigneeIds = task.assignees.map((a) => a.userId);
    const mentionSet = new Set(mentionedUserIds);
    const commentRecipients = assigneeIds.filter((id) => !mentionSet.has(id));
    if (commentRecipients.length > 0) {
      notify(request.server.prisma, request.server, {
        recipients: commentRecipients,
        type: "COMMENT_ADDED",
        title: `New comment on "${task.title}"`,
        body: `${request.user!.displayName}: ${body.body.slice(0, 100)}`,
        data: {
          taskId: params.tid,
          projectId,
          commentId: comment.id,
          actorId: request.user!.id,
          actorName: request.user!.displayName,
          taskTitle: task.title,
        },
        excludeUserId: request.user!.id,
      }).catch((err) => request.log.error(err, "Failed to send comment notification"));
    }

    // Notify mentioned users
    if (mentionedUserIds.length > 0) {
      notify(request.server.prisma, request.server, {
        recipients: mentionedUserIds,
        type: "COMMENT_MENTION",
        title: `${request.user!.displayName} mentioned you in "${task.title}"`,
        body: body.body.slice(0, 100),
        data: {
          taskId: params.tid,
          projectId,
          commentId: comment.id,
          actorId: request.user!.id,
          actorName: request.user!.displayName,
          taskTitle: task.title,
        },
        excludeUserId: request.user!.id,
      }).catch((err) => request.log.error(err, "Failed to send mention notification"));
    }
  }
  return reply.status(201).send({ data: comment });
}

export async function updateCommentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { id: string };
  const body = request.body as UpdateCommentInput;
  const { comment, projectId } = await commentsService.updateComment(
    request.server.prisma,
    params.id,
    request.user!.id,
    request.workspaceMember!.role,
    body,
  );
  request.server.broadcast(projectId, "comment_updated", {
    taskId: comment.taskId,
    commentId: comment.id,
  });
  return reply.send({ data: comment });
}

export async function deleteCommentHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = request.params as { id: string };
  const { taskId, projectId } = await commentsService.deleteComment(
    request.server.prisma,
    params.id,
    request.user!.id,
    request.workspaceMember!.role,
  );
  request.server.broadcast(projectId, "comment_deleted", {
    taskId,
    commentId: params.id,
  });
  return reply.status(204).send();
}
