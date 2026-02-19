import { useState } from "react";
import {
  useProjectMembers,
  useAddProjectMember,
  useRemoveProjectMember,
} from "../api";
import { useWorkspaceMembers } from "@/features/workspaces/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Plus, X } from "lucide-react";

interface MemberManagerProps {
  projectId: string;
  workspaceId: string;
}

export function MemberManager({ projectId, workspaceId }: MemberManagerProps) {
  const { data: membersData } = useProjectMembers(projectId);
  const { data: wsMembersData } = useWorkspaceMembers(workspaceId);
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);

  const members = membersData?.data ?? [];
  const wsMembers = wsMembersData?.data ?? [];

  const [showAdd, setShowAdd] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  // Filter workspace members not yet in project
  const availableMembers = wsMembers.filter(
    (wm) => !members.some((pm) => pm.userId === wm.userId),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Members</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>

      {showAdd && availableMembers.length > 0 && (
        <div className="rounded-md border p-2 space-y-1">
          <p className="text-xs text-muted-foreground mb-2">
            Add workspace member to project:
          </p>
          {availableMembers.map((wm) => (
            <button
              key={wm.user.id}
              onClick={() => {
                addMember.mutate(
                  { userId: wm.user.id },
                  { onSuccess: () => setShowAdd(false) },
                );
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <UserAvatar
                displayName={wm.user.displayName}
                avatarUrl={wm.user.avatarUrl}
                size="sm"
              />
              <span>{wm.user.displayName}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {wm.user.email}
              </span>
            </button>
          ))}
        </div>
      )}

      {showAdd && availableMembers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          All workspace members are already in this project.
        </p>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-2 rounded-md border px-3 py-2"
          >
            <UserAvatar
              displayName={member.user.displayName}
              avatarUrl={member.user.avatarUrl}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {member.user.displayName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {member.user.email}
              </p>
            </div>
            <button
              onClick={() =>
                setRemoveTarget({
                  userId: member.userId,
                  name: member.user.displayName,
                })
              }
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) {
            removeMember.mutate(removeTarget.userId, {
              onSuccess: () => setRemoveTarget(null),
            });
          }
        }}
        title="Remove member"
        description={`Remove ${removeTarget?.name} from this project? They will be unassigned from all tasks.`}
        confirmLabel="Remove"
        loading={removeMember.isPending}
      />
    </div>
  );
}
