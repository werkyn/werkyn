import { CustomFieldType, Priority } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const CUSTOM_FIELD_TYPES = new Set<string>(Object.values(CustomFieldType));
const PRIORITIES = new Set<string>(Object.values(Priority));

export function toCustomFieldType(value: string): CustomFieldType {
  if (!CUSTOM_FIELD_TYPES.has(value)) {
    throw new Error(`Invalid custom field type: ${value}`);
  }
  return value as CustomFieldType;
}

export function toPriority(value: string): Priority {
  if (!PRIORITIES.has(value)) {
    throw new Error(`Invalid priority: ${value}`);
  }
  return value as Priority;
}

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
