import { useState } from "react";
import { useLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LABEL_COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6",
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6",
];

interface LabelManagerProps {
  projectId: string;
}

export function LabelManager({ projectId }: LabelManagerProps) {
  const { data } = useLabels(projectId);
  const createLabel = useCreateLabel(projectId);
  const updateLabel = useUpdateLabel(projectId);
  const deleteLabel = useDeleteLabel(projectId);

  const labels = data?.data ?? [];

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createLabel.mutate(
      { name: newName.trim(), color: newColor },
      {
        onSuccess: () => {
          setNewName("");
          setNewColor(LABEL_COLORS[0]);
        },
      },
    );
  };

  const handleUpdate = (id: string) => {
    if (!editingName.trim()) return;
    updateLabel.mutate(
      { id, name: editingName.trim() },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Labels</h3>

      <div className="space-y-2">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2"
          >
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: label.color }}
            />

            {editingId === label.id ? (
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(label.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={() => handleUpdate(label.id)}
                className="h-7 text-sm"
                autoFocus
              />
            ) : (
              <span
                className="flex-1 text-sm cursor-pointer"
                onClick={() => {
                  setEditingId(label.id);
                  setEditingName(label.name);
                }}
              >
                {label.name}
              </span>
            )}

            {label._count && (
              <span className="text-xs text-muted-foreground">
                {label._count.tasks}
              </span>
            )}

            <button
              onClick={() => setDeleteTarget(label.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {labels.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">No labels yet</p>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex gap-1">
          {LABEL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewColor(color)}
              className={cn(
                "h-5 w-5 rounded-full transition-all",
                newColor === color
                  ? "ring-2 ring-offset-1 ring-primary"
                  : "hover:scale-110",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New label..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleCreate}
          disabled={!newName.trim() || createLabel.isPending}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteLabel.mutate(deleteTarget, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        title="Delete label"
        description="This label will be removed from all tasks."
        confirmLabel="Delete"
        loading={deleteLabel.isPending}
      />
    </div>
  );
}
