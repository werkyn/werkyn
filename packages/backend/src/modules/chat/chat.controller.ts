import type { FastifyRequest, FastifyReply } from "fastify";
import type {
  CreateChannelInput,
  UpdateChannelInput,
  SendMessageInput,
  UpdateMessageInput,
  CreateDmInput,
  AddMembersInput,
  ChatMessageQueryInput,
  ToggleReactionInput,
} from "@pm/shared";
import * as chatService from "./chat.service.js";
import { broadcastToChannel, broadcastToWorkspace } from "../realtime/realtime.service.js";

// ─── Channels ──────────────────────────────────────────

export async function listChannelsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { wid } = request.params as { wid: string };
  const channels = await chatService.listChannels(
    request.server.prisma,
    wid,
    request.user!.id,
  );
  return reply.send({ data: channels });
}

export async function getChannelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };
  const channel = await chatService.getChannel(
    request.server.prisma,
    channelId,
    request.user!.id,
  );
  return reply.send({ data: channel });
}

export async function createChannelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { wid } = request.params as { wid: string };
  const body = request.body as CreateChannelInput;

  const channel = await chatService.createChannel(
    request.server.prisma,
    wid,
    request.user!.id,
    body,
  );

  broadcastToWorkspace(wid, "chat_channel_created", { channel }, request.user!.id);

  return reply.status(201).send({ data: channel });
}

export async function updateChannelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };
  const body = request.body as UpdateChannelInput;

  const channel = await chatService.updateChannel(
    request.server.prisma,
    channelId,
    request.user!.id,
    request.workspaceMember!.role,
    body,
  );

  broadcastToChannel(channelId, "chat_channel_updated", { channel });

  return reply.send({ data: channel });
}

export async function deleteChannelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { wid, channelId } = request.params as { wid: string; channelId: string };

  await chatService.deleteChannel(
    request.server.prisma,
    channelId,
    request.user!.id,
    request.workspaceMember!.role,
  );

  broadcastToWorkspace(wid, "chat_channel_deleted", { channelId }, request.user!.id);

  return reply.status(204).send();
}

export async function joinChannelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };

  await chatService.joinChannel(
    request.server.prisma,
    channelId,
    request.user!.id,
  );

  broadcastToChannel(channelId, "chat_member_added", {
    channelId,
    userId: request.user!.id,
  });

  return reply.status(204).send();
}

export async function leaveChannelHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };

  await chatService.leaveChannel(
    request.server.prisma,
    channelId,
    request.user!.id,
  );

  broadcastToChannel(channelId, "chat_member_removed", {
    channelId,
    userId: request.user!.id,
  });

  return reply.status(204).send();
}

// ─── Members ───────────────────────────────────────────

export async function listMembersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };
  const members = await chatService.listMembers(
    request.server.prisma,
    channelId,
  );
  return reply.send({ data: members });
}

export async function addMembersHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };
  const body = request.body as AddMembersInput;

  await chatService.addMembers(
    request.server.prisma,
    channelId,
    request.user!.id,
    request.workspaceMember!.role,
    body.userIds,
  );

  for (const uid of body.userIds) {
    broadcastToChannel(channelId, "chat_member_added", {
      channelId,
      userId: uid,
    });
  }

  return reply.status(204).send();
}

export async function removeMemberHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId, userId } = request.params as {
    channelId: string;
    userId: string;
  };

  await chatService.removeMembers(
    request.server.prisma,
    channelId,
    request.user!.id,
    request.workspaceMember!.role,
    userId,
  );

  broadcastToChannel(channelId, "chat_member_removed", {
    channelId,
    userId,
  });

  return reply.status(204).send();
}

// ─── Messages ──────────────────────────────────────────

export async function listMessagesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };
  const query = request.query as ChatMessageQueryInput;

  const result = await chatService.listMessages(
    request.server.prisma,
    channelId,
    query.cursor,
    query.limit,
  );
  return reply.send(result);
}

export async function sendMessageHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };
  const body = request.body as SendMessageInput;

  const message = await chatService.sendMessage(
    request.server.prisma,
    channelId,
    request.user!.id,
    body.content,
    body.parentId,
  );

  broadcastToChannel(channelId, "chat_message_created", {
    message,
    channelId,
  });

  return reply.status(201).send({ data: message });
}

export async function updateMessageHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { messageId } = request.params as { messageId: string };
  const body = request.body as UpdateMessageInput;

  const message = await chatService.updateMessage(
    request.server.prisma,
    messageId,
    request.user!.id,
    body.content,
  );

  broadcastToChannel(message.channelId, "chat_message_updated", {
    message,
    channelId: message.channelId,
  });

  return reply.send({ data: message });
}

export async function deleteMessageHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { messageId } = request.params as { messageId: string };

  const { channelId } = await chatService.deleteMessage(
    request.server.prisma,
    messageId,
    request.user!.id,
    request.workspaceMember!.role,
  );

  broadcastToChannel(channelId, "chat_message_deleted", {
    messageId,
    channelId,
  });

  return reply.status(204).send();
}

export async function getThreadRepliesHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { messageId } = request.params as { messageId: string };
  const query = request.query as ChatMessageQueryInput;

  const result = await chatService.getThreadReplies(
    request.server.prisma,
    messageId,
    query.cursor,
    query.limit,
  );
  return reply.send(result);
}

// ─── Unread ────────────────────────────────────────────

export async function markReadHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };

  await chatService.markRead(
    request.server.prisma,
    channelId,
    request.user!.id,
  );
  return reply.status(204).send();
}

export async function getUnreadCountsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { wid } = request.params as { wid: string };

  const counts = await chatService.getUnreadCounts(
    request.server.prisma,
    wid,
    request.user!.id,
  );
  return reply.send({ data: counts });
}

// ─── DMs ───────────────────────────────────────────────

export async function findOrCreateDmHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { wid } = request.params as { wid: string };
  const body = request.body as CreateDmInput;

  const channel = await chatService.findOrCreateDm(
    request.server.prisma,
    wid,
    request.user!.id,
    body.userIds,
  );

  return reply.status(201).send({ data: channel });
}

// ─── Typing ────────────────────────────────────────────

export async function typingHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { channelId } = request.params as { channelId: string };

  broadcastToChannel(channelId, "chat_typing", {
    channelId,
    userId: request.user!.id,
    displayName: request.user!.displayName,
  }, request.user!.id);

  return reply.status(204).send();
}

// ─── Reactions ──────────────────────────────────────────

export async function toggleReactionHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { messageId } = request.params as { messageId: string };
  const body = request.body as ToggleReactionInput;

  const result = await chatService.toggleReaction(
    request.server.prisma,
    messageId,
    request.user!.id,
    body.emoji,
  );

  broadcastToChannel(result.channelId, "chat_reaction_updated", {
    messageId,
    channelId: result.channelId,
    userId: request.user!.id,
    emoji: body.emoji,
    action: result.action,
  });

  return reply.send({ data: { action: result.action } });
}
