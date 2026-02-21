import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceMember {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

interface DmUserPickerProps {
  open: boolean;
  onClose: () => void;
  members: WorkspaceMember[];
  currentUserId: string;
  onSubmit: (userIds: string[]) => void;
  loading?: boolean;
}

export function DmUserPicker({
  open,
  onClose,
  members,
  currentUserId,
  onSubmit,
  loading,
}: DmUserPickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();
    return members
      .filter((m) => m.id !== currentUserId)
      .filter(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q),
      );
  }, [members, currentUserId, search]);

  const toggleUser = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else if (next.size < 7) {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0) return;
    onSubmit(Array.from(selected));
    setSelected(new Set());
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSelected(new Set()); setSearch(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {filteredMembers.map((m) => {
              const isSelected = selected.has(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleUser(m.id)}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors text-left",
                    isSelected && "bg-accent",
                  )}
                >
                  <UserAvatar
                    displayName={m.displayName}
                    avatarUrl={m.avatarUrl}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{m.displayName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {m.email}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
            {filteredMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members found
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selected.size === 0 || loading}
          >
            {loading ? "Creating..." : `Start conversation${selected.size > 1 ? ` (${selected.size})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
