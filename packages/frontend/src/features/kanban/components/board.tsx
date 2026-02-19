import { useState, useMemo, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  pointerWithin,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useProjectTasks, useMoveTask, type Task } from "@/features/tasks/api";
import { useStatuses } from "@/features/projects/api";
import { Column } from "./column";
import { DragOverlayCard } from "./drag-overlay-card";

interface BoardProps {
  projectId: string;
  filters?: Record<string, unknown>;
  onTaskClick: (taskId: string) => void;
  canCreate: boolean;
  canDrag: boolean;
}

function buildKanbanCollision(columnIds: Set<string>): CollisionDetection {
  return (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length === 0) {
      return closestCenter(args);
    }
    const hitIds = new Set(pointerCollisions.map((c) => c.id));
    const taskHits = args.droppableContainers.filter(
      (c) => hitIds.has(c.id) && !columnIds.has(String(c.id)),
    );
    if (taskHits.length > 0) {
      return closestCenter({ ...args, droppableContainers: taskHits });
    }
    return pointerCollisions;
  };
}

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.5" } },
  }),
};

// ── Helpers: work with column-grouped data, never flat arrays ──

type ColumnMap = Map<string, Task[]>;

function buildColumnMap(tasks: Task[], statusIds: string[]): ColumnMap {
  const map: ColumnMap = new Map();
  for (const id of statusIds) map.set(id, []);
  for (const t of tasks) {
    map.get(t.statusId)?.push({ ...t });
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.position - b.position);
  }
  return map;
}

function flattenColumnMap(map: ColumnMap): Task[] {
  const result: Task[] = [];
  for (const list of map.values()) {
    for (let i = 0; i < list.length; i++) {
      list[i].position = i;
      result.push(list[i]);
    }
  }
  return result;
}

export function Board({
  projectId,
  filters,
  onTaskClick,
  canCreate,
  canDrag,
}: BoardProps) {
  const { data: statusesData } = useStatuses(projectId);
  const { data: tasksData, isLoading } = useProjectTasks(projectId, filters);
  const moveTask = useMoveTask(projectId);

  const statuses = useMemo(
    () => (statusesData?.data ?? []).sort((a, b) => a.position - b.position),
    [statusesData],
  );

  const serverTasks = tasksData?.data ?? [];

  const columnIds = useMemo(
    () => new Set(statuses.map((s) => s.id)),
    [statuses],
  );
  const collisionDetection = useMemo(
    () => buildKanbanCollision(columnIds),
    [columnIds],
  );

  const statusIds = useMemo(() => statuses.map((s) => s.id), [statuses]);

  // Local task state for live reordering during drag
  const [localTasks, setLocalTasks] = useState<Task[] | null>(null);
  const localTasksRef = useRef<Task[] | null>(null);
  const tasks = localTasks ?? serverTasks;

  const updateLocalTasks = useCallback(
    (updater: Task[] | null | ((prev: Task[] | null) => Task[] | null)) => {
      setLocalTasks((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        localTasksRef.current = next;
        return next;
      });
    },
    [],
  );

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const status of statuses) map.set(status.id, []);
    for (const task of tasks) {
      map.get(task.statusId)?.push(task);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [statuses, tasks]);

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) {
        setActiveTask(task);
        // Deep clone so we never mutate React Query cache
        updateLocalTasks(serverTasks.map((t) => ({ ...t })));
      }
    },
    [tasks, serverTasks, updateLocalTasks],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      updateLocalTasks((prev) => {
        if (!prev) return prev;

        const activeTask = prev.find((t) => t.id === activeId);
        if (!activeTask) return prev;

        const isColumn = columnIds.has(overId);
        const overTask = !isColumn ? prev.find((t) => t.id === overId) : null;
        const targetStatusId = isColumn ? overId : overTask?.statusId;
        if (!targetStatusId) return prev;

        // Early bail: same column, hovering over self or column header
        const sameCol = activeTask.statusId === targetStatusId;
        if (sameCol) {
          if (isColumn || activeId === overId) return prev;
        }

        // Build column-grouped data (clones tasks)
        const cols = buildColumnMap(prev, statusIds);
        const srcCol = cols.get(activeTask.statusId)!;
        const dstCol = cols.get(targetStatusId)!;
        if (!srcCol || !dstCol) return prev;

        // Remove active from its current column
        const srcIdx = srcCol.findIndex((t) => t.id === activeId);
        if (srcIdx === -1) return prev;
        const [removed] = srcCol.splice(srcIdx, 1);
        removed.statusId = targetStatusId;

        // Insert into destination
        if (!isColumn && (overTask || sameCol)) {
          const overIdx = dstCol.findIndex((t) => t.id === overId);
          if (overIdx === -1) {
            dstCol.push(removed);
          } else if (sameCol) {
            // Same column: use index direction to decide placement.
            // If active was above the over item (srcIdx <= overIdx after
            // removal), we're dragging down → insert after. Otherwise
            // we're dragging up → insert before.
            const insertIdx = srcIdx <= overIdx ? overIdx + 1 : overIdx;
            dstCol.splice(insertIdx, 0, removed);
          } else {
            // Cross column: insert before the hovered card
            dstCol.splice(overIdx, 0, removed);
          }
        } else {
          // Column droppable (empty or area) — append at end
          dstCol.push(removed);
        }

        return flattenColumnMap(cols);
      });
    },
    [columnIds, statusIds, updateLocalTasks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);

      const { active, over } = event;
      if (!over) {
        updateLocalTasks(null);
        return;
      }

      const activeId = String(active.id);
      const overId = String(over.id);

      // Read from ref for the latest value
      const currentLocal = localTasksRef.current;
      const movedTask = currentLocal?.find((t) => t.id === activeId);
      const originalTask = serverTasks.find((t) => t.id === activeId);

      if (!originalTask) {
        updateLocalTasks(null);
        return;
      }

      // Check if onDragOver computed a move
      const localChanged =
        movedTask &&
        (movedTask.statusId !== originalTask.statusId ||
          movedTask.position !== originalTask.position);

      if (localChanged) {
        moveTask.mutate(
          {
            id: activeId,
            statusId: movedTask.statusId,
            position: movedTask.position,
          },
          { onSettled: () => updateLocalTasks(null) },
        );
        return;
      }

      // Fallback: resolve from over element (e.g. empty column)
      const isColumn = columnIds.has(overId);
      const overTask = serverTasks.find((t) => t.id === overId);
      const targetStatusId = isColumn ? overId : overTask?.statusId;

      if (
        !targetStatusId ||
        (targetStatusId === originalTask.statusId && activeId === overId)
      ) {
        updateLocalTasks(null);
        return;
      }

      // Position is a 0-based index into the sorted column
      let position: number;
      if (isColumn) {
        // Dropped on column itself — append at end
        const colTasks = serverTasks.filter(
          (t) => t.statusId === targetStatusId && t.id !== activeId,
        );
        position = colTasks.length;
      } else if (overTask) {
        // Dropped on a specific task — use its index in the column
        const colTasks = serverTasks
          .filter((t) => t.statusId === targetStatusId && t.id !== activeId)
          .sort((a, b) => a.position - b.position);
        const idx = colTasks.findIndex((t) => t.id === overId);
        position = idx === -1 ? colTasks.length : idx;
      } else {
        position = 0;
      }

      moveTask.mutate(
        { id: activeId, statusId: targetStatusId, position },
        { onSettled: () => updateLocalTasks(null) },
      );
    },
    [serverTasks, columnIds, moveTask, updateLocalTasks],
  );

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    updateLocalTasks(null);
  }, [updateLocalTasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto p-4 h-full">
        {statuses.map((status) => (
          <Column
            key={status.id}
            status={status}
            tasks={tasksByStatus.get(status.id) ?? []}
            projectId={projectId}
            onTaskClick={onTaskClick}
            canCreate={canCreate}
            canDrag={canDrag}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? <DragOverlayCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
