import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRenameFile, type DriveFile } from "../api";
import { toast } from "sonner";

interface RenameDialogProps {
  file: DriveFile | null;
  onClose: () => void;
  workspaceId: string;
}

export function RenameDialog({
  file,
  onClose,
  workspaceId,
}: RenameDialogProps) {
  const [name, setName] = useState("");
  const renameFile = useRenameFile(workspaceId);

  useEffect(() => {
    if (file) setName(file.name);
  }, [file]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;

    renameFile.mutate(
      { fileId: file.id, name: name.trim() },
      {
        onSuccess: () => {
          toast.success("Renamed successfully");
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to rename");
        },
      },
    );
  };

  return (
    <Dialog open={!!file} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || renameFile.isPending}
            >
              {renameFile.isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
