import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  useSubtasks,
  useCreateSubtask,
  useUpdateSubtask,
  useToggleSubtask,
  useReorderSubtasks,
  useDeleteSubtask,
} from "../api";
import { SubtaskItem } from "./subtask-item";
import { Plus } from "lucide-react";

interface SubtaskListProps {
  taskId: string;
  projectId: string;
  canEdit: boolean;
}

export function SubtaskList({ taskId, projectId, canEdit }: SubtaskListProps) {
  const { data, isLoading } = useSubtasks(taskId);
  const subtasks = data?.data ?? [];

  const createMutation = useCreateSubtask(taskId, projectId);
  const updateMutation = useUpdateSubtask(taskId);
  const toggleMutation = useToggleSubtask(taskId, projectId);
  const reorderMutation = useReorderSubtasks(taskId);
  const deleteMutation = useDeleteSubtask(taskId, projectId);

  const [newTitle, setNewTitle] = useState("");
  const [showInput, setShowInput] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const completed = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;

  const handleAdd = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    createMutation.mutate({ title: trimmed });
    setNewTitle("");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = subtasks.findIndex((s) => s.id === active.id);
    const newIndex = subtasks.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(subtasks, oldIndex, newIndex);
    reorderMutation.mutate(reordered.map((s) => s.id));
  };

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-8 w-full bg-muted rounded" />
        <div className="h-8 w-full bg-muted rounded" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Subtasks
          {total > 0 && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
              {completed}/{total}
            </span>
          )}
        </h3>
        {canEdit && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      {total > 0 && (
        <div className="mb-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={subtasks.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                canEdit={canEdit}
                onToggle={(id) => toggleMutation.mutate(id)}
                onUpdate={(id, title) =>
                  updateMutation.mutate({ id, title })
                }
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {showInput && canEdit && (
        <div className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setShowInput(false);
                setNewTitle("");
              }
            }}
            placeholder="Subtask title..."
            className="flex-1 rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || createMutation.isPending}
            className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowInput(false);
              setNewTitle("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {total === 0 && !showInput && (
        <p className="text-sm text-muted-foreground">No subtasks</p>
      )}
    </div>
  );
}
