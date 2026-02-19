import { useState } from "react";
import { useArchiveTask, useDeleteTask, useDuplicateTask } from "../api";
import type { TaskDetail } from "../api";
import { useCreateTemplate } from "@/features/templates/api";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Archive, ArchiveRestore, Trash2, Copy, Bookmark } from "lucide-react";

interface TaskActionsProps {
  task: TaskDetail;
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
}

export function TaskActions({
  task,
  canEdit,
  canDelete,
  onClose,
}: TaskActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const archiveTask = useArchiveTask(task.projectId, onClose);
  const deleteTask = useDeleteTask(task.projectId, onClose);
  const duplicateTask = useDuplicateTask(task.projectId);
  const createTemplate = useCreateTemplate(task.projectId);

  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) return;
    createTemplate.mutate(
      {
        name: templateName.trim(),
        title: task.title,
        description: task.description ?? undefined,
        priority: task.priority,
        statusId: task.statusId,
        assigneeIds: task.assignees.map((a) => a.userId),
        labelIds: task.labels.map((l) => l.labelId),
        subtasks: (task.subtasks ?? []).map((s) => ({ title: s.title })),
      },
      {
        onSuccess: () => {
          setTemplateOpen(false);
          setTemplateName("");
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-2 border-t pt-4 flex-wrap">
      {canEdit && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => duplicateTask.mutate(task.id)}
            disabled={duplicateTask.isPending}
          >
            <Copy className="h-4 w-4 mr-1" />
            {duplicateTask.isPending ? "Duplicating..." : "Duplicate"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTemplateName(task.title);
              setTemplateOpen(true);
            }}
          >
            <Bookmark className="h-4 w-4 mr-1" />
            Save as template
          </Button>

          <Dialog open={templateOpen} onOpenChange={(v) => !v && setTemplateOpen(false)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Save as template</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 mt-2">
                <label className="text-sm font-medium">Template name</label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveAsTemplate();
                  }}
                />
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setTemplateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveAsTemplate}
                  disabled={!templateName.trim() || createTemplate.isPending}
                >
                  {createTemplate.isPending ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {canDelete && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setArchiveOpen(true)}
          >
            {task.archived ? (
              <>
                <ArchiveRestore className="h-4 w-4 mr-1" />
                Unarchive
              </>
            ) : (
              <>
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </>
            )}
          </Button>
          <ConfirmDialog
            open={archiveOpen}
            onClose={() => setArchiveOpen(false)}
            onConfirm={() => {
              archiveTask.mutate({ id: task.id, archived: !task.archived });
              setArchiveOpen(false);
            }}
            title={task.archived ? "Unarchive task?" : "Archive task?"}
            description={
              task.archived
                ? "This task will be restored to its column."
                : "Archived tasks are hidden from the board."
            }
            confirmLabel={task.archived ? "Unarchive" : "Archive"}
            variant="default"
            loading={archiveTask.isPending}
          />
        </>
      )}

      {canDelete && (
        <>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <ConfirmDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onConfirm={() => {
              deleteTask.mutate(task.id);
              setDeleteOpen(false);
            }}
            title="Delete task?"
            description="This action cannot be undone. The task and all its data will be permanently deleted."
            confirmLabel="Delete"
            variant="destructive"
            loading={deleteTask.isPending}
          />
        </>
      )}
    </div>
  );
}
