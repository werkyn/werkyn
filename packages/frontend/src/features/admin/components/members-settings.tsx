import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  useWorkspaceMembers,
  useUpdateMemberRole,
  useRemoveMember,
} from "@/features/workspaces/api";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface MembersSettingsProps {
  workspaceId: string;
}

export function MembersSettings({ workspaceId }: MembersSettingsProps) {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useWorkspaceMembers(workspaceId);
  const members = data?.data ?? [];

  const updateRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);

  const handleRoleChange = (userId: string, role: string) => {
    updateRole.mutate(
      { userId, role: role as "ADMIN" | "MEMBER" | "VIEWER" },
      { onError: (err) => toast.error(err.message) },
    );
  };

  const handleRemove = (userId: string, displayName: string) => {
    if (!confirm(`Remove ${displayName} from this workspace?`)) return;
    removeMember.mutate(userId, {
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Members ({members.length})
      </h2>

      <div className="border rounded-md divide-y">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <UserAvatar
              displayName={m.user.displayName}
              avatarUrl={m.user.avatarUrl}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {m.user.displayName}
                {m.user.id === user?.id && (
                  <span className="text-muted-foreground ml-1">(you)</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {m.user.email}
              </div>
            </div>
            <Select
              value={m.role}
              onValueChange={(v) => handleRoleChange(m.userId, v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
            {m.user.id !== user?.id && (
              <button
                onClick={() => handleRemove(m.userId, m.user.displayName)}
                className="rounded p-1 hover:bg-accent transition-colors text-muted-foreground hover:text-destructive"
                title="Remove member"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
