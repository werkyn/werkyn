import { useState, useEffect } from "react";
import { useCreateWikiSpace } from "../api";
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
import { EmojiPicker } from "@/components/shared/emoji-picker";

interface CreateSpaceDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CreateSpaceDialog({
  open,
  onClose,
  workspaceId,
}: CreateSpaceDialogProps) {
  const createSpace = useCreateWikiSpace(workspaceId);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setIcon(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createSpace.mutate(
      {
        name: name.trim(),
        ...(description.trim() && { description: description.trim() }),
        ...(icon && { icon }),
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create space</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Icon (optional)</Label>
              <div>
                <EmojiPicker value={icon} onChange={setIcon}>
                  <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-input hover:bg-accent transition-colors"
                  >
                    {icon ? (
                      <span className="text-2xl">{icon}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">+</span>
                    )}
                  </button>
                </EmojiPicker>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="space-name">Name</Label>
              <Input
                id="space-name"
                placeholder="e.g. Engineering Docs"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="space-desc">Description (optional)</Label>
              <Input
                id="space-desc"
                placeholder="What is this space about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createSpace.isPending}
            >
              {createSpace.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
