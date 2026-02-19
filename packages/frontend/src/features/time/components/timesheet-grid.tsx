import { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { Plus, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TaskSelector } from "./task-project-selector";
import { TimeEntryCell } from "./time-entry-cell";
import { formatShortDate, formatDateISO } from "../utils";
import {
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useDeleteTimeEntry,
  type TimeEntry,
} from "../api";

interface TimesheetGridProps {
  workspaceId: string;
  entries: TimeEntry[];
  weekDays: Date[];
  readOnly?: boolean;
}

interface RowKey {
  taskId: string | null;
  description: string | null;
}

interface TimesheetRowData {
  id: string;
  key: RowKey;
  label: string;
  sublabel?: string;
  color?: string | null;
  dayHours: number[];
  dayEntryIds: (string | null)[];
  total: number;
  isPending: boolean;
  billable: boolean;
  entryIds: string[];
}

function rowKeyStr(r: RowKey): string {
  return `${r.taskId ?? "none"}::${r.description ?? ""}`;
}

const columnHelper = createColumnHelper<TimesheetRowData>();
const coreRowModel = getCoreRowModel<TimesheetRowData>();
const getRowId = (row: TimesheetRowData) => row.id;

export function TimesheetGrid({
  workspaceId,
  entries,
  weekDays,
  readOnly,
}: TimesheetGridProps) {
  const dates = useMemo(() => weekDays.map(formatDateISO), [weekDays]);
  const createMutation = useCreateTimeEntry(workspaceId);
  const updateMutation = useUpdateTimeEntry();
  const deleteMutation = useDeleteTimeEntry();

  const [pendingRows, setPendingRows] = useState<
    Array<{ key: RowKey; label: string; sublabel?: string; billable: boolean }>
  >([]);

  const { rows: dataRows, existingKeys } = useMemo(() => {
    const rowMap = new Map<string, TimesheetRowData>();

    for (const entry of entries) {
      const rk: RowKey = {
        taskId: entry.taskId,
        description: entry.description,
      };
      const ks = rowKeyStr(rk);
      if (!rowMap.has(ks)) {
        rowMap.set(ks, {
          id: ks,
          key: rk,
          label: entry.task?.title ?? entry.description ?? "General time",
          sublabel: entry.project?.name ?? undefined,
          color: entry.project?.color,
          dayHours: new Array(7).fill(0),
          dayEntryIds: new Array(7).fill(null),
          total: 0,
          isPending: false,
          billable: entry.billable,
          entryIds: [],
        });
      }
      const row = rowMap.get(ks)!;
      row.entryIds.push(entry.id);
      const dayIndex = dates.indexOf(entry.date);
      if (dayIndex >= 0) {
        row.dayHours[dayIndex] += entry.hours;
        row.dayEntryIds[dayIndex] = entry.id;
      }
    }

    for (const row of rowMap.values()) {
      row.total = row.dayHours.reduce((s, h) => s + h, 0);
    }

    const keys = new Set(rowMap.keys());
    return { rows: Array.from(rowMap.values()), existingKeys: keys };
  }, [entries, dates]);

  const activePendingRows = useMemo(
    () =>
      pendingRows
        .filter((pr) => !existingKeys.has(rowKeyStr(pr.key)))
        .map((pr) => ({
          id: `pending-${rowKeyStr(pr.key)}`,
          key: pr.key,
          label: pr.label,
          sublabel: pr.sublabel,
          dayHours: new Array(7).fill(0),
          dayEntryIds: new Array(7).fill(null),
          total: 0,
          isPending: true,
          billable: pr.billable,
          entryIds: [] as string[],
        })),
    [pendingRows, existingKeys],
  );

  const allRows = useMemo(
    () => [...dataRows, ...activePendingRows],
    [dataRows, activePendingRows],
  );

  const dailyTotals = dates.map((date) =>
    entries.filter((e) => e.date === date).reduce((s, e) => s + e.hours, 0),
  );
  const weekTotal = dailyTotals.reduce((s, h) => s + h, 0);

  const [adding, setAdding] = useState(false);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState<string | null>(null);
  const [newDesc, setNewDesc] = useState("");

  const handleCellChange = useCallback(
    (
      row: RowKey,
      dayIndex: number,
      hours: number,
      existingEntryId: string | null,
      billable: boolean,
    ) => {
      if (existingEntryId) {
        if (hours === 0) {
          deleteMutation.mutate(existingEntryId);
        } else {
          updateMutation.mutate({ id: existingEntryId, data: { hours } });
        }
      } else if (hours > 0) {
        createMutation.mutate({
          date: dates[dayIndex],
          hours,
          taskId: row.taskId ?? undefined,
          description: row.description ?? undefined,
          billable,
        });
      }
    },
    [dates, createMutation, updateMutation, deleteMutation],
  );

  const handleToggleBillable = useCallback(
    (row: TimesheetRowData) => {
      const newBillable = !row.billable;
      // Update all existing entries in this row
      for (const entryId of row.entryIds) {
        updateMutation.mutate({ id: entryId, data: { billable: newBillable } });
      }
      // Update pending row state if it's a pending row
      if (row.isPending) {
        setPendingRows((prev) =>
          prev.map((pr) =>
            rowKeyStr(pr.key) === rowKeyStr(row.key)
              ? { ...pr, billable: newBillable }
              : pr,
          ),
        );
      }
    },
    [updateMutation],
  );

  const handleDeleteRow = useCallback(
    (row: RowKey) => {
      const rowEntries = entries.filter(
        (e) => e.taskId === row.taskId && e.description === row.description,
      );
      for (const entry of rowEntries) {
        deleteMutation.mutate(entry.id);
      }
      setPendingRows((prev) =>
        prev.filter((pr) => rowKeyStr(pr.key) !== rowKeyStr(row)),
      );
    },
    [entries, deleteMutation],
  );

  function handleQuickAdd() {
    const key: RowKey = {
      taskId: newTaskId,
      description: newDesc.trim() || null,
    };

    const ks = rowKeyStr(key);
    if (
      existingKeys.has(ks) ||
      activePendingRows.some((pr) => pr.id === `pending-${ks}`)
    ) {
      setAdding(false);
      setNewTaskId(null);
      setNewTaskLabel(null);
      setNewDesc("");
      return;
    }

    setPendingRows((prev) => [
      ...prev,
      {
        key,
        label: newTaskLabel ?? (newDesc.trim() || "General time"),
        billable: true,
      },
    ]);
    setAdding(false);
    setNewTaskId(null);
    setNewTaskLabel(null);
    setNewDesc("");
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("label", {
        header: "Task",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.color && (
              <div
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: row.original.color }}
              />
            )}
            <div className="min-w-0">
              <div className="text-sm font-medium truncate max-w-[180px]">
                {row.original.label}
              </div>
              {row.original.sublabel && (
                <div className="text-xs text-muted-foreground truncate">
                  {row.original.sublabel}
                </div>
              )}
            </div>
          </div>
        ),
        size: 220,
      }),
      columnHelper.display({
        id: "billable",
        header: () => (
          <DollarSign className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
        ),
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => !readOnly && handleToggleBillable(row.original)}
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-md transition-colors mx-auto",
              readOnly
                ? "cursor-default"
                : "cursor-pointer hover:bg-accent",
              row.original.billable
                ? "text-green-600 dark:text-green-400"
                : "text-muted-foreground/40",
            )}
            title={row.original.billable ? "Billable (click to toggle)" : "Non-billable (click to toggle)"}
          >
            <DollarSign className="h-3.5 w-3.5" />
          </button>
        ),
        size: 44,
      }),
      ...weekDays.map((day, i) =>
        columnHelper.display({
          id: `day-${i}`,
          header: () => formatShortDate(day),
          cell: ({ row }) => (
            <TimeEntryCell
              hours={row.original.dayHours[i]}
              onChange={(h) =>
                handleCellChange(
                  row.original.key,
                  i,
                  h,
                  row.original.dayEntryIds[i],
                  row.original.billable,
                )
              }
              readOnly={readOnly}
            />
          ),
          size: 80,
        }),
      ),
      columnHelper.accessor("total", {
        header: "Total",
        cell: ({ getValue }) => {
          const t = getValue();
          return (
            <span className="font-semibold text-sm">
              {t > 0 ? t.toFixed(t % 1 === 0 ? 0 : 2) + "h" : "–"}
            </span>
          );
        },
        size: 70,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) =>
          !readOnly ? (
            <button
              onClick={() => handleDeleteRow(row.original.key)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null,
        size: 40,
      }),
    ],
    [weekDays, dates, readOnly, handleCellChange, handleDeleteRow, handleToggleBillable],
  );

  const table = useReactTable({
    data: allRows,
    columns,
    getCoreRowModel: coreRowModel,
    getRowId: getRowId,
  });

  const headerGroups = table.getHeaderGroups();

  return (
    <div className="flex-1 overflow-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-background border-b">
          {headerGroups.map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, i) => (
                <th
                  key={header.id}
                  className={cn(
                    "px-3 py-2 text-left text-xs font-medium text-muted-foreground",
                    header.id !== "label" && "text-center",
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
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "border-b hover:bg-accent/50 transition-colors",
                row.original.isPending && "bg-muted/20",
              )}
            >
              {row.getVisibleCells().map((cell, i) => (
                <td
                  key={cell.id}
                  className={cn(
                    "px-3 py-1.5",
                    cell.column.id !== "label" && "text-center",
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
          ))}
          {allRows.length === 0 && !adding && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-sm text-muted-foreground"
              >
                No time entries this week. Click "Add Row" to start tracking.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-muted/30 border-t">
            <td className="px-3 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
              Daily Total
            </td>
            <td className="border-r border-border" />
            {dailyTotals.map((total, i) => (
              <td
                key={dates[i]}
                className="px-3 py-2 text-center text-xs font-semibold border-r border-border"
              >
                {total > 0 ? total.toFixed(total % 1 === 0 ? 0 : 2) + "h" : "–"}
              </td>
            ))}
            <td className="px-3 py-2 text-center text-xs font-bold border-r border-border">
              {weekTotal > 0
                ? weekTotal.toFixed(weekTotal % 1 === 0 ? 0 : 2) + "h"
                : "–"}
            </td>
            <td className="px-3 py-2" />
          </tr>
        </tfoot>
      </table>

      {!readOnly && (
        <div className="border-t px-3 py-2 bg-background">
          {adding ? (
            <div className="flex items-center gap-2">
              <TaskSelector
                workspaceId={workspaceId}
                taskId={newTaskId}
                onChange={(taskId, label) => {
                  setNewTaskId(taskId);
                  setNewTaskLabel(label);
                }}
              />
              <Input
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="h-8 text-sm max-w-xs"
                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              />
              <Button size="sm" variant="default" onClick={handleQuickAdd}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setNewTaskId(null);
                  setNewTaskLabel(null);
                  setNewDesc("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
