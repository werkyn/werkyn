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
import { Label } from "@/components/ui/label";
import { useCreateChannel } from "../api";
import { toast } from "sonner";

interface CreateChannelDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  onCreated?: (channelId: string) => void;
}

export function CreateChannelDialog({
  open,
  onClose,
  workspaceId,
  onCreated,
}: CreateChannelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const createChannel = useCreateChannel(workspaceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createChannel.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
      },
      {
        onSuccess: (res) => {
          toast.success("Channel created");
          setName("");
          setDescription("");
          setType("PUBLIC");
          onClose();
          onCreated?.(res.data.id);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to create channel");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Name</Label>
              <Input
                id="channel-name"
                placeholder="general"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-desc">Description (optional)</Label>
              <Textarea
                id="channel-desc"
                placeholder="What's this channel about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="min-h-[60px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={type === "PUBLIC"}
                    onChange={() => setType("PUBLIC")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Public</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={type === "PRIVATE"}
                    onChange={() => setType("PRIVATE")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Private</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createChannel.isPending}
            >
              {createChannel.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
