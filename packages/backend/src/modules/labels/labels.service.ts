import type { PrismaClient } from "@prisma/client";
import type { CreateLabelInput, UpdateLabelInput } from "@pm/shared";
import { ConflictError, NotFoundError } from "../../utils/errors.js";

export async function listLabels(
  prisma: PrismaClient,
  projectId: string,
) {
  return prisma.label.findMany({
    where: { projectId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createLabel(
  prisma: PrismaClient,
  projectId: string,
  data: CreateLabelInput,
) {
  try {
    return await prisma.label.create({
      data: {
        projectId,
        name: data.name,
        color: data.color,
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      throw new ConflictError("A label with this name already exists in the project");
    }
    throw error;
  }
}

export async function updateLabel(
  prisma: PrismaClient,
  projectId: string,
  labelId: string,
  data: UpdateLabelInput,
) {
  const label = await prisma.label.findFirst({
    where: { id: labelId, projectId },
  });
  if (!label) {
    throw new NotFoundError("Label not found");
  }

  // Check name uniqueness if name is being changed
  if (data.name && data.name !== label.name) {
    const existing = await prisma.label.findUnique({
      where: { projectId_name: { projectId, name: data.name } },
    });
    if (existing) {
      throw new ConflictError("A label with this name already exists in the project");
    }
  }

  return prisma.label.update({
    where: { id: labelId },
    data: {
      name: data.name,
      color: data.color,
    },
  });
}

export async function deleteLabel(
  prisma: PrismaClient,
  projectId: string,
  labelId: string,
) {
  const label = await prisma.label.findFirst({
    where: { id: labelId, projectId },
  });
  if (!label) {
    throw new NotFoundError("Label not found");
  }

  await prisma.label.delete({ where: { id: labelId } });
}
