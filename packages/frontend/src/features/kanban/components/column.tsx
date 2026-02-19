import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskCard } from "./task-card";
import { QuickAdd } from "./quick-add";
import type { Task } from "@/features/tasks/api";

interface StatusColumn {
  id: string;
  name: string;
  color: string | null;
  position: number;
  isCompletion: boolean;
}

interface ColumnProps {
  status: StatusColumn;
  tasks: Task[];
  projectId: string;
  onTaskClick: (taskId: string) => void;
  canCreate: boolean;
  canDrag: boolean;
}

export function Column({
  status,
  tasks,
  projectId,
  onTaskClick,
  canCreate,
  canDrag,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id: status.id });
  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 pb-3">
        <div
          className="h-3 w-3 rounded-full shrink-0"
          style={{ backgroundColor: status.color ?? "#6b7280" }}
        />
        <h3 className="text-sm font-semibold truncate">{status.name}</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1 min-h-[120px]"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              isDragDisabled={!canDrag}
            />
          ))}
        </SortableContext>

        {canCreate && (
          <QuickAdd projectId={projectId} statusId={status.id} />
        )}
      </div>
    </div>
  );
}
