export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_ORDER: Record<Priority, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  URGENT: 3,
};
