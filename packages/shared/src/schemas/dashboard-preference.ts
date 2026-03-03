import { z } from "zod";

const WidgetConfigItemSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
});

export const UpdateDashboardPreferenceSchema = z.object({
  widgetOrder: z.array(WidgetConfigItemSchema).min(1).max(20),
});

export type UpdateDashboardPreferenceInput = z.infer<typeof UpdateDashboardPreferenceSchema>;
export type WidgetConfigItem = z.infer<typeof WidgetConfigItemSchema>;
