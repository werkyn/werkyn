import type { PrismaClient } from "@prisma/client";
import type { UpdateEmailConfigInput } from "@pm/shared";
import { resetTransporter } from "../../utils/mailer.js";

const PASSWORD_MASK = "••••••••";

export async function getEmailConfig(prisma: PrismaClient) {
  let config = await prisma.emailConfig.findUnique({
    where: { id: "singleton" },
  });

  if (!config) {
    config = await prisma.emailConfig.create({
      data: { id: "singleton" },
    });
  }

  return {
    ...config,
    pass: config.pass ? PASSWORD_MASK : "",
  };
}

export async function getRawEmailConfig(prisma: PrismaClient) {
  return prisma.emailConfig.findUnique({
    where: { id: "singleton" },
  });
}

export async function updateEmailConfig(
  prisma: PrismaClient,
  data: UpdateEmailConfigInput,
) {
  // If password is the mask string, remove it so we don't overwrite
  const updateData = { ...data };
  if (updateData.pass === PASSWORD_MASK) {
    delete updateData.pass;
  }

  const config = await prisma.emailConfig.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...updateData },
    update: updateData,
  });

  // Invalidate cached mailer transport
  resetTransporter();

  return {
    ...config,
    pass: config.pass ? PASSWORD_MASK : "",
  };
}
