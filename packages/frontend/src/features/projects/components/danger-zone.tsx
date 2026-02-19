import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useArchiveProject, useDeleteProject } from "../api";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface DangerZoneProps {
  projectId: string;
  workspaceId: string;
  workspaceSlug: string;
  archived: boolean;
}

export function DangerZone({
  projectId,
  workspaceId,
  workspaceSlug,
  archived,
}: DangerZoneProps) {
  const navigate = useNavigate();
  const archiveProject = useArchiveProject(projectId, workspaceId);
  const deleteProject = useDeleteProject(projectId, workspaceId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>

      <div className="rounded-md border border-destructive/30 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {archived ? "Unarchive project" : "Archive project"}
            </p>
            <p className="text-xs text-muted-foreground">
              {archived
                ? "Restore this project and make it visible again."
                : "Hide this project from the sidebar. Tasks will be preserved."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              archiveProject.mutate({ archived: !archived })
            }
            disabled={archiveProject.isPending}
          >
            {archived ? "Unarchive" : "Archive"}
          </Button>
        </div>

        <div className="border-t" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete project</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete this project and all its data.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteProject.mutate(undefined, {
            onSuccess: () => {
              navigate({
                to: "/$workspaceSlug",
                params: { workspaceSlug },
              });
            },
          });
        }}
        title="Delete project permanently?"
        description="This will delete all tasks, status columns, labels, and other data in this project. This action cannot be undone."
        confirmLabel="Delete permanently"
        loading={deleteProject.isPending}
      />
    </div>
  );
}
