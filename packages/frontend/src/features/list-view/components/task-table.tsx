import { Fragment, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useProjectTasks } from "@/features/tasks/api";
import { useStatuses, useProjectMembers, useLabels, useCustomFields } from "@/features/projects/api";
import { getColumns } from "./columns";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskTableProps {
  projectId: string;
  filters?: Record<string, unknown>;
  onTaskClick: (taskId: string) => void;
  canEdit: boolean;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (selection: RowSelectionState) => void;
  onUpdateTask: (id: string, data: Record<string, unknown>) => void;
}

export function TaskTable({
  projectId,
  filters,
  onTaskClick,
  canEdit,
  rowSelection,
  onRowSelectionChange,
  onUpdateTask,
}: TaskTableProps) {
  const { data, isLoading } = useProjectTasks(projectId, filters);
  const { data: statusData } = useStatuses(projectId);
  const { data: membersData } = useProjectMembers(projectId);
  const { data: labelsData } = useLabels(projectId);
  const { data: customFieldsData } = useCustomFields(projectId);

  const tasks = data?.data ?? [];
  const statuses = useMemo(
    () => [...(statusData?.data ?? [])].sort((a, b) => a.position - b.position),
    [statusData],
  );
  const members = useMemo(
    () => (membersData?.data ?? []).map((m) => m.user),
    [membersData],
  );
  const projectLabels = useMemo(
    () => (labelsData?.data ?? []).map((l) => ({ id: l.id, name: l.name, color: l.color })),
    [labelsData],
  );
  const customFields = useMemo(
    () => customFieldsData?.data ?? [],
    [customFieldsData],
  );

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  const columns = useMemo(
    () => getColumns({ canEdit, onTaskClick, onUpdateTask, statuses, members, projectLabels, customFields }),
    [canEdit, onTaskClick, onUpdateTask, statuses, members, projectLabels, customFields],
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(rowSelection) : updater;
      onRowSelectionChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: canEdit,
  });

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    for (const status of statuses) {
      map.set(status.id, []);
    }
    for (const task of tasks) {
      const group = map.get(task.statusId);
      if (group) {
        group.push(task);
      } else {
        map.set(task.statusId, [task]);
      }
    }
    // Sort tasks within each group by position
    for (const group of map.values()) {
      group.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [tasks, statuses]);

  const toggleCollapse = (statusId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(statusId)) {
        next.delete(statusId);
      } else {
        next.add(statusId);
      }
      return next;
    });
  };

  // Get row models for rendering cells via TanStack Table
  const rowModel = table.getRowModel();
  const rowById = useMemo(() => {
    const map = new Map<string, (typeof rowModel.rows)[number]>();
    for (const row of rowModel.rows) {
      map.set(row.id, row);
    }
    return map;
  }, [rowModel.rows]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground text-sm">
        No tasks found
      </div>
    );
  }

  const headerGroups = table.getHeaderGroups();

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-background border-b">
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, i) => (
                <th
                  key={header.id}
                  className={cn(
                    "px-3 py-2 text-left text-xs font-medium text-muted-foreground",
                    i < headerGroup.headers.length - 1 &&
                      "border-r border-border",
                  )}
                  style={{ width: header.getSize() }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {statuses.map((status) => {
            const groupTasks = tasksByStatus.get(status.id) ?? [];
            const isCollapsed = collapsedGroups.has(status.id);
            const color = status.color ?? "#94a3b8";

            return (
              <Fragment key={status.id}>
                {/* Group header row */}
                <tr className="bg-muted/30">
                  <td
                    colSpan={columns.length}
                    className="px-2 py-1.5"
                    style={{ borderLeft: `4px solid ${color}` }}
                  >
                    <button
                      onClick={() => toggleCollapse(status.id)}
                      className="flex items-center gap-2 w-full"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span
                        className="font-semibold text-sm"
                        style={{ color }}
                      >
                        {status.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {groupTasks.length} task
                        {groupTasks.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                  </td>
                </tr>

                {/* Task rows */}
                {!isCollapsed &&
                  groupTasks.map((task) => {
                    const row = rowById.get(task.id);
                    if (!row) return null;
                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b hover:bg-accent/50 transition-colors",
                          row.getIsSelected() && "bg-primary/5",
                        )}
                        style={{ borderLeft: `4px solid ${color}` }}
                      >
                        {row.getVisibleCells().map((cell, i) => (
                          <td
                            key={cell.id}
                            className={cn(
                              "px-3 py-1.5",
                              i < row.getVisibleCells().length - 1 &&
                                "border-r border-border",
                            )}
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
