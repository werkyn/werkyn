import { z } from "zod";

export const RecurrenceFrequencyEnum = z.enum(["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"]);

export const CreateRecurringSchema = z
  .object({
    templateId: z.string().min(1, "Template is required"),
    frequency: RecurrenceFrequencyEnum,
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.frequency === "WEEKLY" || data.frequency === "BIWEEKLY") {
        return data.dayOfWeek !== undefined;
      }
      return true;
    },
    { message: "dayOfWeek is required for WEEKLY/BIWEEKLY", path: ["dayOfWeek"] },
  )
  .refine(
    (data) => {
      if (data.frequency === "MONTHLY") {
        return data.dayOfMonth !== undefined;
      }
      return true;
    },
    { message: "dayOfMonth is required for MONTHLY", path: ["dayOfMonth"] },
  );
export type CreateRecurringInput = z.infer<typeof CreateRecurringSchema>;

export const UpdateRecurringSchema = z.object({
  frequency: RecurrenceFrequencyEnum.optional(),
  dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});
export type UpdateRecurringInput = z.infer<typeof UpdateRecurringSchema>;
