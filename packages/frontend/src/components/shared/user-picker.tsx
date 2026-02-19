import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { UserAvatar } from "./user-avatar";
import { Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface UserPickerProps {
  users: User[];
  selectedIds: string[];
  onSelect: (userId: string) => void;
  onDeselect: (userId: string) => void;
  disabled?: boolean;
}

export function UserPicker({
  users,
  selectedIds,
  onSelect,
  onDeselect,
  disabled,
}: UserPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs",
            "hover:bg-accent transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <UserPlus className="h-3.5 w-3.5" />
          Assign
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-64" align="start">
        <Command>
          <CommandInput placeholder="Search members..." />
          <CommandList>
            <CommandEmpty>No members found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => {
                const selected = selectedIds.includes(user.id);
                return (
                  <CommandItem
                    key={user.id}
                    value={user.displayName}
                    onSelect={() => {
                      if (selected) {
                        onDeselect(user.id);
                      } else {
                        onSelect(user.id);
                      }
                    }}
                  >
                    <UserAvatar
                      displayName={user.displayName}
                      avatarUrl={user.avatarUrl}
                      size="sm"
                    />
                    <span className="flex-1 truncate">{user.displayName}</span>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
