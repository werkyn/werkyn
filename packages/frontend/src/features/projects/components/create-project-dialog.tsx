import { useState, useEffect } from "react";
import { useCreateProject } from "../api";
import { useWorkspaceMembers } from "@/features/workspaces/api";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Plus, X, Check } from "lucide-react";
import type { CreateProjectInput } from "@pm/shared";

const PROJECT_COLORS = [
  "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

const LABEL_COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#3b82f6",
  "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6",
];

const STATUS_COLORS = [
  "#94a3b8", "#3b82f6", "#22c55e", "#f59e0b",
  "#ef4444", "#8b5cf6",
];

const DEFAULT_STATUSES: StatusEntry[] = [
  { name: "To Do", color: "#94a3b8", isCompletion: false },
  { name: "In Progress", color: "#3b82f6", isCompletion: false },
  { name: "Done", color: "#22c55e", isCompletion: true },
];

interface StatusEntry {
  name: string;
  color: string;
  isCompletion: boolean;
}

interface LabelEntry {
  name: string;
  color: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CreateProjectDialog({
  open,
  onClose,
  workspaceId,
}: CreateProjectDialogProps) {
  const createProject = useCreateProject(workspaceId);
  const { data: wsMembersData } = useWorkspaceMembers(workspaceId);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const wsMembers = (wsMembersData?.data ?? []).filter(
    (m) => m.userId !== currentUserId,
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [showMore, setShowMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Status columns
  const [statusColumns, setStatusColumns] = useState<StatusEntry[]>([]);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState(STATUS_COLORS[0]);

  // Labels
  const [projectLabels, setProjectLabels] = useState<LabelEntry[]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0]);

  // Members
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setColor(PROJECT_COLORS[0]);
      setShowMore(false);
      setSubmitting(false);
      setStatusColumns(DEFAULT_STATUSES.map((s) => ({ ...s })));
      setNewStatusName("");
      setNewStatusColor(STATUS_COLORS[0]);
      setProjectLabels([]);
      setNewLabelName("");
      setNewLabelColor(LABEL_COLORS[0]);
      setSelectedMemberIds([]);
    }
  }, [open]);

  const addStatus = () => {
    if (!newStatusName.trim()) return;
    setStatusColumns((prev) => [
      ...prev,
      { name: newStatusName.trim(), color: newStatusColor, isCompletion: false },
    ]);
    setNewStatusName("");
    setNewStatusColor(STATUS_COLORS[0]);
  };

  const addLabel = () => {
    if (!newLabelName.trim()) return;
    setProjectLabels((prev) => [
      ...prev,
      { name: newLabelName.trim(), color: newLabelColor },
    ]);
    setNewLabelName("");
    setNewLabelColor(LABEL_COLORS[0]);
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);

    const data: CreateProjectInput = {
      name: name.trim(),
      color,
      ...(description.trim() && { description: description.trim() }),
    };

    createProject.mutate(data, {
      onSuccess: async (result) => {
        const pid = result.data.id;

        try {
          // Check if status columns were customized
          const statusesChanged =
            statusColumns.length !== DEFAULT_STATUSES.length ||
            statusColumns.some(
              (col, i) =>
                col.name !== DEFAULT_STATUSES[i].name ||
                col.color !== DEFAULT_STATUSES[i].color ||
                col.isCompletion !== DEFAULT_STATUSES[i].isCompletion,
            );

          if (statusesChanged) {
            // Create the custom columns first
            for (const col of statusColumns) {
              await api
                .post(`projects/${pid}/statuses`, {
                  json: { name: col.name, color: col.color, isCompletion: col.isCompletion },
                })
                .json();
            }
            // Then delete the auto-created defaults
            const { data: existing } = await api
              .get(`projects/${pid}/statuses`)
              .json<{ data: Array<{ id: string; name: string; color: string | null; position: number }> }>();
            // The auto-created defaults are the first 3 (lowest positions)
            const defaults = existing
              .sort((a, b) => a.position - b.position)
              .slice(0, DEFAULT_STATUSES.length);
            for (const s of defaults) {
              await api.delete(`projects/${pid}/statuses/${s.id}`);
            }
          }

          // Create labels
          for (const label of projectLabels) {
            await api
              .post(`projects/${pid}/labels`, {
                json: { name: label.name, color: label.color },
              })
              .json();
          }

          // Add members
          for (const userId of selectedMemberIds) {
            await api
              .post(`projects/${pid}/members`, {
                json: { userId },
              })
              .json();
          }

          // Invalidate relevant queries
          if (statusesChanged) {
            queryClient.invalidateQueries({ queryKey: queryKeys.statuses(pid) });
          }
          if (projectLabels.length > 0) {
            queryClient.invalidateQueries({ queryKey: queryKeys.labels(pid) });
          }
          if (selectedMemberIds.length > 0) {
            queryClient.invalidateQueries({ queryKey: queryKeys.projectMembers(pid) });
          }
        } catch {
          // Project was created; extras can be configured in settings
        }

        setSubmitting(false);
        onClose();
      },
      onError: () => {
        setSubmitting(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                placeholder="My Project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            {/* More options toggle */}
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showMore ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              More options
            </button>

            {showMore && (
              <div className="space-y-5">
                {/* Color */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {PROJECT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={cn(
                          "h-7 w-7 rounded-full transition-all",
                          color === c
                            ? "ring-2 ring-offset-2 ring-primary"
                            : "hover:scale-110",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="project-desc">Description</Label>
                  <Input
                    id="project-desc"
                    placeholder="What's this project about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Status Columns */}
                <div className="space-y-2">
                  <Label>Status Columns</Label>
                  <p className="text-xs text-muted-foreground">
                    Mark one column as the completion status (tasks are considered done).
                  </p>
                  <div className="space-y-1.5">
                    {statusColumns.map((col, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 rounded-md border px-3 py-1.5"
                        >
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (i === 0) return;
                                setStatusColumns((prev) => {
                                  const next = [...prev];
                                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                                  return next;
                                });
                              }}
                              disabled={i === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (i === statusColumns.length - 1) return;
                                setStatusColumns((prev) => {
                                  const next = [...prev];
                                  [next[i], next[i + 1]] = [next[i + 1], next[i]];
                                  return next;
                                });
                              }}
                              disabled={i === statusColumns.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: col.color }}
                          />
                          <span className="flex-1 text-sm">{col.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setStatusColumns((prev) =>
                                prev.map((s, j) => ({
                                  ...s,
                                  isCompletion: j === i ? !s.isCompletion : false,
                                })),
                              );
                            }}
                            className={cn(
                              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors",
                              col.isCompletion
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "text-muted-foreground hover:text-green-600",
                            )}
                            title={
                              col.isCompletion
                                ? "Completion column (click to unset)"
                                : "Set as completion column"
                            }
                          >
                            <Check className="h-3.5 w-3.5" />
                            {col.isCompletion && <span>Done</span>}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setStatusColumns((prev) =>
                                prev.filter((_, j) => j !== i),
                              )
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {STATUS_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewStatusColor(c)}
                          className={cn(
                            "h-5 w-5 rounded-full transition-all",
                            newStatusColor === c
                              ? "ring-2 ring-offset-1 ring-primary"
                              : "hover:scale-110",
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <Input
                      value={newStatusName}
                      onChange={(e) => setNewStatusName(e.target.value)}
                      placeholder="New status..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addStatus();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addStatus}
                      disabled={!newStatusName.trim()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Labels */}
                <div className="space-y-2">
                  <Label>Labels</Label>
                  {projectLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {projectLabels.map((label, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                          <button
                            type="button"
                            onClick={() =>
                              setProjectLabels((prev) =>
                                prev.filter((_, j) => j !== i),
                              )
                            }
                            className="ml-0.5 hover:opacity-70"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {LABEL_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewLabelColor(c)}
                          className={cn(
                            "h-5 w-5 rounded-full transition-all",
                            newLabelColor === c
                              ? "ring-2 ring-offset-1 ring-primary"
                              : "hover:scale-110",
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <Input
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="New label..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addLabel();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addLabel}
                      disabled={!newLabelName.trim()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Members */}
                <div className="space-y-2">
                  <Label>Members</Label>
                  <p className="text-xs text-muted-foreground">
                    You're added automatically. Select additional members below.
                  </p>
                  {wsMembers.length > 0 ? (
                    <div className="space-y-1 max-h-40 overflow-y-auto rounded-md border p-1.5">
                      {wsMembers.map((wm) => {
                        const selected = selectedMemberIds.includes(wm.userId);
                        return (
                          <button
                            key={wm.userId}
                            type="button"
                            onClick={() => toggleMember(wm.userId)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                              selected
                                ? "bg-accent"
                                : "hover:bg-accent/50",
                            )}
                          >
                            <UserAvatar
                              displayName={wm.user.displayName}
                              avatarUrl={wm.user.avatarUrl}
                              size="sm"
                            />
                            <span className="flex-1 text-left truncate">
                              {wm.user.displayName}
                            </span>
                            {selected && (
                              <Check className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No other workspace members to add.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {createProject.isError && (
            <p className="mt-2 text-sm text-destructive">
              {createProject.error instanceof ApiError
                ? createProject.error.message
                : "Failed to create project"}
            </p>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || submitting}
            >
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
