import type { PrismaClient } from "@prisma/client";
import type { CreateInviteInput } from "@pm/shared";
import crypto from "node:crypto";
import {
  ConflictError,
  ForbiddenError,
  GoneError,
  NotFoundError,
} from "../../utils/errors.js";

export async function createInvite(
  prisma: PrismaClient,
  workspaceId: string,
  data: CreateInviteInput,
) {
  const token = crypto.randomBytes(32).toString("hex");

  return prisma.workspaceInvite.create({
    data: {
      workspaceId,
      email: data.email,
      role: data.role,
      token,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      maxUses: data.maxUses ?? null,
    },
  });
}

export async function listInvites(
  prisma: PrismaClient,
  workspaceId: string,
) {
  const now = new Date();

  return prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvite(
  prisma: PrismaClient,
  inviteId: string,
  workspaceId: string,
) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite || invite.workspaceId !== workspaceId) {
    throw new NotFoundError("Invite not found");
  }

  await prisma.workspaceInvite.delete({ where: { id: inviteId } });
}

export async function getInviteByToken(
  prisma: PrismaClient,
  token: string,
) {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true, logoUrl: true },
      },
    },
  });

  if (!invite) {
    throw new NotFoundError("Invite not found or has been revoked");
  }

  const now = new Date();
  if (invite.expiresAt && invite.expiresAt < now) {
    throw new GoneError("This invite has expired");
  }

  if (invite.maxUses && invite.useCount >= invite.maxUses) {
    throw new GoneError("This invite has reached its usage limit");
  }

  return {
    id: invite.id,
    workspace: invite.workspace,
    role: invite.role,
    email: invite.email,
  };
}

export async function acceptInvite(
  prisma: PrismaClient,
  token: string,
  userId: string,
  userEmail: string,
) {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: { select: { id: true, slug: true, name: true } },
      },
    });

    if (!invite) {
      throw new NotFoundError("Invite not found or has been revoked");
    }

    const now = new Date();
    if (invite.expiresAt && invite.expiresAt < now) {
      throw new GoneError("This invite has expired");
    }

    if (invite.maxUses && invite.useCount >= invite.maxUses) {
      throw new GoneError("This invite has reached its usage limit");
    }

    // Check workspace settings
    const settings = await tx.workspaceSettings.findUnique({
      where: { workspaceId: invite.workspaceId },
    });

    if (settings) {
      if (!settings.invitesEnabled) {
        throw new ForbiddenError("Invites are currently disabled for this workspace");
      }

      if (settings.allowedEmailDomains.length > 0) {
        const emailDomain = userEmail.split("@")[1]?.toLowerCase();
        const allowed = settings.allowedEmailDomains.some(
          (d) => d.toLowerCase() === emailDomain,
        );
        if (!allowed) {
          throw new ForbiddenError("Your email domain is not allowed for this workspace");
        }
      }

      if (settings.maxMembers) {
        const memberCount = await tx.workspaceMember.count({
          where: { workspaceId: invite.workspaceId },
        });
        if (memberCount >= settings.maxMembers) {
          throw new ForbiddenError("This workspace has reached its member limit");
        }
      }
    }

    // Check email restriction
    if (invite.email && invite.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenError("This invite is restricted to a specific email");
    }

    // Check if already a member
    const existingMember = await tx.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: invite.workspaceId,
        },
      },
    });
    if (existingMember) {
      throw new ConflictError("You are already a member of this workspace");
    }

    // Increment use count with guard
    const updated = await tx.workspaceInvite.updateMany({
      where: {
        id: invite.id,
        OR: [
          { maxUses: null },
          { useCount: { lt: invite.maxUses ?? 999999 } },
        ],
      },
      data: { useCount: { increment: 1 } },
    });

    if (updated.count === 0) {
      throw new GoneError("This invite has reached its usage limit");
    }

    // Create workspace member
    await tx.workspaceMember.create({
      data: {
        userId,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    });

    return invite.workspace;
  });
}
