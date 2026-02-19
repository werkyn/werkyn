import { useState } from "react";
import {
  useStatuses,
  useCreateStatus,
  useUpdateStatus,
  useDeleteStatus,
  useReorderStatuses,
} from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, ChevronUp, ChevronDown, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_COLORS = [
  "#94a3b8", "#64748b", "#6b7280",
  "#3b82f6", "#6366f1", "#8b5cf6",
  "#22c55e", "#10b981", "#14b8a6",
  "#f59e0b", "#f97316", "#ef4444",
];

interface StatusColumnManagerProps {
  projectId: string;
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="h-5 w-5 rounded-full shrink-0 ring-offset-background transition-all hover:ring-2 hover:ring-offset-1 hover:ring-primary"
          style={{ backgroundColor: value }}
          title="Change color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-6 gap-1.5">
          {STATUS_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              className={cn(
                "h-6 w-6 rounded-full transition-all",
                value === c
                  ? "ring-2 ring-offset-1 ring-primary"
                  : "hover:scale-110",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function StatusColumnManager({ projectId }: StatusColumnManagerProps) {
  const { data } = useStatuses(projectId);
  const createStatus = useCreateStatus(projectId);
  const updateStatus = useUpdateStatus(projectId);
  const deleteStatus = useDeleteStatus(projectId);
  const reorderStatuses = useReorderStatuses(projectId);

  const statuses = data?.data ?? [];

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(STATUS_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createStatus.mutate(
      { name: newName.trim(), color: newColor, isCompletion: false },
      {
        onSuccess: () => {
          setNewName("");
          setNewColor(STATUS_COLORS[0]);
        },
      },
    );
  };

  const handleUpdate = (id: string) => {
    if (!editingName.trim()) return;
    updateStatus.mutate(
      { id, name: editingName.trim() },
      { onSuccess: () => setEditingId(null) },
    );
  };

  const handleColorChange = (id: string, color: string) => {
    updateStatus.mutate({ id, color });
  };

  const handleToggleCompletion = (id: string, current: boolean) => {
    updateStatus.mutate({ id, isCompletion: !current });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = statuses.map((s) => s.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    reorderStatuses.mutate({ orderedIds: ids });
  };

  const handleMoveDown = (index: number) => {
    if (index === statuses.length - 1) return;
    const ids = statuses.map((s) => s.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    reorderStatuses.mutate({ orderedIds: ids });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Status Columns</h3>

      <div className="space-y-2">
        {statuses.map((status, index) => (
          <div
            key={status.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2"
          >
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === statuses.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            <ColorPicker
              value={status.color ?? "#94a3b8"}
              onChange={(color) => handleColorChange(status.id, color)}
            />

            {editingId === status.id ? (
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(status.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={() => handleUpdate(status.id)}
                className="h-7 text-sm"
                autoFocus
              />
            ) : (
              <span
                className="flex-1 text-sm cursor-pointer"
                onClick={() => {
                  setEditingId(status.id);
                  setEditingName(status.name);
                }}
              >
                {status.name}
              </span>
            )}

            <button
              onClick={() => handleToggleCompletion(status.id, status.isCompletion)}
              className={
                status.isCompletion
                  ? "text-green-600"
                  : "text-muted-foreground hover:text-green-600"
              }
              title={
                status.isCompletion
                  ? "Completion column"
                  : "Set as completion column"
              }
            >
              <Check className="h-4 w-4" />
            </button>

            <button
              onClick={() => setDeleteTarget(status.id)}
              disabled={statuses.length <= 1}
              className="text-muted-foreground hover:text-destructive disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <ColorPicker value={newColor} onChange={setNewColor} />
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New status column..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleCreate}
          disabled={!newName.trim() || createStatus.isPending}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteStatus.mutate(deleteTarget, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        title="Delete status column"
        description="Tasks in this column will be moved to the first remaining column."
        confirmLabel="Delete"
        loading={deleteStatus.isPending}
      />
    </div>
  );
}
