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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInvite } from "../api";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

interface InviteDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function InviteDialog({ open, onClose, workspaceId }: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [maxUses, setMaxUses] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createInvite = useCreateInvite(workspaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createInvite.mutate(
      {
        email: email || undefined,
        role,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      },
      {
        onSuccess: (res) => {
          const link = `${window.location.origin}/invite/${res.data.token}`;
          setInviteLink(link);
          toast.success("Invite created");
        },
      },
    );
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail("");
    setRole("MEMBER");
    setMaxUses("");
    setInviteLink(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to workspace</DialogTitle>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with the person you want to invite:
            </p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email (optional)</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If set, only this email can accept the invite
              </p>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as typeof role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-max-uses">Max uses (optional)</Label>
              <Input
                id="invite-max-uses"
                type="number"
                min={1}
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInvite.isPending}>
                {createInvite.isPending ? "Creating..." : "Create invite"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
