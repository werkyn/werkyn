import type { Task } from "@/features/tasks/api";

interface StatusColumn {
  id: string;
  name: string;
  color: string | null;
  position: number;
  isCompletion: boolean;
}

/**
 * Given a droppable `overId`, resolve which status column it refers to.
 * The overId might be a column ID (dropping on an empty column) or a task ID
 * (dropping near another card).
 */
export function resolveTargetColumn(
  overId: string,
  statuses: StatusColumn[],
  tasks: Task[],
): StatusColumn | undefined {
  // Check if overId is a column ID
  const column = statuses.find((s) => s.id === overId);
  if (column) return column;

  // Otherwise it's a task ID — find that task's column
  const task = tasks.find((t) => t.id === overId);
  if (task) {
    return statuses.find((s) => s.id === task.statusId);
  }

  return undefined;
}

/**
 * Resolve the target position for a task being dropped.
 * If dropped on a task, insert at that task's position.
 * If dropped on an empty column, position is 0.
 */
export function resolveTargetPosition(
  overId: string,
  columnId: string,
  tasks: Task[],
  activeId: string,
): number {
  const columnTasks = tasks
    .filter((t) => t.statusId === columnId && t.id !== activeId)
    .sort((a, b) => a.position - b.position);

  // If dropped directly on the column, place at end
  if (overId === columnId) {
    const maxPos = columnTasks.length > 0
      ? Math.max(...columnTasks.map((t) => t.position))
      : -1;
    return maxPos + 1;
  }

  // If dropped on a specific task, take that task's position
  const overTask = columnTasks.find((t) => t.id === overId);
  if (overTask) {
    return overTask.position;
  }

  return columnTasks.length;
}
