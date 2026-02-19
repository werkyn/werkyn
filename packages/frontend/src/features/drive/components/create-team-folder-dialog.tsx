import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTeamFolder } from "../api";
import { useWorkspaceMembers } from "@/features/workspaces/api";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

interface CreateTeamFolderDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CreateTeamFolderDialog({
  open,
  onClose,
  workspaceId,
}: CreateTeamFolderDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

  const createTeamFolder = useCreateTeamFolder(workspaceId);
  const { data: membersData } = useWorkspaceMembers(workspaceId);
  const members = membersData?.data ?? [];

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createTeamFolder.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMemberIds.size > 0 ? Array.from(selectedMemberIds) : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Team folder created");
          setName("");
          setDescription("");
          setSelectedMemberIds(new Set());
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create team folder");
        },
      },
    );
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedMemberIds(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Team Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Marketing Assets"
              autoFocus
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Members ({selectedMemberIds.size} selected)
            </label>
            <div className="mt-1 max-h-48 overflow-y-auto border rounded-md">
              {members.map((m) => {
                const isSelected = selectedMemberIds.has(m.user.id);
                return (
                  <button
                    key={m.user.id}
                    type="button"
                    onClick={() => toggleMember(m.user.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors text-left ${
                      isSelected ? "bg-accent/50" : ""
                    }`}
                  >
                    <UserAvatar
                      displayName={m.user.displayName}
                      avatarUrl={m.user.avatarUrl}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{m.user.displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.user.email}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
              {members.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                  No workspace members found
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createTeamFolder.isPending}
            >
              {createTeamFolder.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
