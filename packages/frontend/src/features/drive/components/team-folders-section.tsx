import { useState } from "react";
import {
  useTeamFolders,
  useDeleteTeamFolder,
  useUpdateTeamFolder,
  type TeamFolder,
} from "../api";
import { CreateTeamFolderDialog } from "./create-team-folder-dialog";
import { TeamFolderMembersDialog } from "./team-folder-members-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface TeamFoldersSectionProps {
  workspaceId: string;
  isAdmin: boolean;
  onNavigate: (folderId: string, teamFolderId: string) => void;
}

export function TeamFoldersSection({
  workspaceId,
  isAdmin,
  onNavigate,
}: TeamFoldersSectionProps) {
  const { data } = useTeamFolders(workspaceId);
  const teamFolders = data?.data ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [membersFolder, setMembersFolder] = useState<TeamFolder | null>(null);
  const [renameFolder, setRenameFolder] = useState<TeamFolder | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<TeamFolder | null>(null);
  const [renameName, setRenameName] = useState("");

  const updateTeamFolder = useUpdateTeamFolder(workspaceId);
  const deleteTeamFolder = useDeleteTeamFolder(workspaceId);

  const handleRename = () => {
    if (!renameFolder || !renameName.trim()) return;
    updateTeamFolder.mutate(
      { tfid: renameFolder.id, name: renameName.trim() },
      {
        onSuccess: () => {
          toast.success("Team folder renamed");
          setRenameFolder(null);
        },
        onError: (err) => toast.error(err.message || "Failed to rename"),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteFolder) return;
    deleteTeamFolder.mutate(deleteFolder.id, {
      onSuccess: () => {
        toast.success("Team folder deleted");
        setDeleteFolder(null);
      },
      onError: (err) => toast.error(err.message || "Failed to delete"),
    });
  };

  if (teamFolders.length === 0 && !isAdmin) return null;

  return (
    <>
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center justify-between px-1 mb-1">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Team Folders
          </h3>
        </div>

        {teamFolders.map((tf) => (
          <div
            key={tf.id}
            className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent/50 transition-colors cursor-pointer group"
            onClick={() => onNavigate(tf.folder.id, tf.id)}
          >
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm truncate flex-1">{tf.name}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {tf._count.members} {tf._count.members === 1 ? "member" : "members"}
            </span>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-accent transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem
                    onClick={() => setMembersFolder(tf)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Manage Members
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameFolder(tf);
                      setRenameName(tf.name);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteFolder(tf)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}

        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create team folder
          </button>
        )}
      </div>

      {/* Separator between team folders and personal files */}
      {(teamFolders.length > 0 || isAdmin) && (
        <div className="mx-3 border-b" />
      )}

      <CreateTeamFolderDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaceId={workspaceId}
      />

      {membersFolder && (
        <TeamFolderMembersDialog
          open={!!membersFolder}
          onClose={() => setMembersFolder(null)}
          workspaceId={workspaceId}
          teamFolderId={membersFolder.id}
          teamFolderName={membersFolder.name}
        />
      )}

      {/* Rename dialog */}
      <Dialog open={!!renameFolder} onOpenChange={(v) => !v && setRenameFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Team Folder</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRename();
            }}
          >
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="Folder name"
              autoFocus
            />
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setRenameFolder(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!renameName.trim() || updateTeamFolder.isPending}>
                {updateTeamFolder.isPending ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteFolder} onOpenChange={(v) => !v && setDeleteFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team Folder?</DialogTitle>
            <DialogDescription>
              "{deleteFolder?.name}" and all its contents will be permanently deleted.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFolder(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTeamFolder.isPending}
            >
              {deleteTeamFolder.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
