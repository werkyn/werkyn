import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useTeamFolder,
  useAddTeamFolderMember,
  useRemoveTeamFolderMember,
} from "../api";
import { useWorkspaceMembers } from "@/features/workspaces/api";
import {
  useGroups,
  useAddTeamFolderGroup,
  useRemoveTeamFolderGroup,
} from "@/features/admin/api";
import { UserAvatar } from "@/components/shared/user-avatar";
import { X, Plus, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface TeamFolderMembersDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  teamFolderId: string;
  teamFolderName: string;
}

export function TeamFolderMembersDialog({
  open,
  onClose,
  workspaceId,
  teamFolderId,
  teamFolderName,
}: TeamFolderMembersDialogProps) {
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const { data: tfData, isLoading } = useTeamFolder(workspaceId, teamFolderId);
  const teamFolder = tfData?.data;
  const currentMembers = teamFolder?.members ?? [];
  const currentGroups = teamFolder?.groups ?? [];

  const { data: wsData } = useWorkspaceMembers(workspaceId);
  const allMembers = wsData?.data ?? [];

  const { data: groupsData } = useGroups(workspaceId);
  const allGroups = groupsData?.data ?? [];

  const addMember = useAddTeamFolderMember(workspaceId, teamFolderId);
  const removeMember = useRemoveTeamFolderMember(workspaceId, teamFolderId);
  const addGroup = useAddTeamFolderGroup(workspaceId, teamFolderId);
  const removeGroup = useRemoveTeamFolderGroup(workspaceId, teamFolderId);

  const currentMemberIds = new Set(currentMembers.map((m) => m.userId));
  const availableMembers = allMembers.filter(
    (m) => !currentMemberIds.has(m.user.id),
  );

  const currentGroupIds = new Set(
    currentGroups.map((g) => g.group.id),
  );
  const availableGroups = allGroups.filter(
    (g) => !currentGroupIds.has(g.id),
  );

  const handleAdd = (userId: string) => {
    addMember.mutate(userId, {
      onSuccess: () => {
        toast.success("Member added");
        setShowAddPicker(false);
      },
      onError: (err) => toast.error(err.message || "Failed to add member"),
    });
  };

  const handleRemove = (userId: string) => {
    removeMember.mutate(userId, {
      onSuccess: () => toast.success("Member removed"),
      onError: (err) => toast.error(err.message || "Failed to remove member"),
    });
  };

  const handleAddGroup = (groupId: string) => {
    addGroup.mutate(groupId, {
      onSuccess: () => {
        toast.success("Group added");
        setShowGroupPicker(false);
      },
      onError: (err) => toast.error(err.message || "Failed to add group"),
    });
  };

  const handleRemoveGroup = (groupId: string) => {
    removeGroup.mutate(groupId, {
      onSuccess: () => toast.success("Group removed"),
      onError: (err) => toast.error(err.message || "Failed to remove group"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Members - {teamFolderName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Groups section */}
            {currentGroups.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Groups
                </div>
                <div className="border rounded-md">
                  {currentGroups.map((g) => {
                    const group = g.group;
                    return (
                      <div
                        key={g.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors"
                      >
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: group.color ?? "#6366f1" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{group.name}</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {group._count.members}
                        </div>
                        <button
                          onClick={() => handleRemoveGroup(group.id)}
                          className="rounded p-1 hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                          title="Remove group"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add group button */}
            {showGroupPicker ? (
              <div className="border rounded-md">
                <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground">
                  Add a group
                </div>
                <div className="max-h-36 overflow-y-auto">
                  {availableGroups.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      No groups available
                    </p>
                  ) : (
                    availableGroups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => handleAddGroup(g.id)}
                        disabled={addGroup.isPending}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
                      >
                        <div
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: g.color ?? "#6366f1" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{g.name}</div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {g._count.members}
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
                <div className="px-3 py-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGroupPicker(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              allGroups.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGroupPicker(true)}
                  className="w-full"
                >
                  <Users className="mr-1.5 h-4 w-4" />
                  Add Group
                </Button>
              )
            )}

            {/* Individual members header */}
            <div className="text-xs font-medium text-muted-foreground">
              Individual Members
            </div>

            {/* Current members */}
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {currentMembers.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No members yet
                </p>
              ) : (
                currentMembers.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors"
                  >
                    <UserAvatar displayName={m.user.displayName} avatarUrl={m.user.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{m.user.displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(m.userId)}
                      className="rounded p-1 hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                      title="Remove member"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add member */}
            {showAddPicker ? (
              <div className="border rounded-md">
                <div className="px-3 py-2 border-b text-xs font-medium text-muted-foreground">
                  Add a member
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {availableMembers.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                      All workspace members are already added
                    </p>
                  ) : (
                    availableMembers.map((m) => (
                      <button
                        key={m.user.id}
                        onClick={() => handleAdd(m.user.id)}
                        disabled={addMember.isPending}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left disabled:opacity-50"
                      >
                        <UserAvatar displayName={m.user.displayName} avatarUrl={m.user.avatarUrl} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{m.user.displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {m.user.email}
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
                <div className="px-3 py-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddPicker(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddPicker(true)}
                className="w-full"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
