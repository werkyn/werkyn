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
import { Check, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelPickerProps {
  labels: Label[];
  selectedIds: string[];
  onSelect: (labelId: string) => void;
  onDeselect: (labelId: string) => void;
  disabled?: boolean;
}

export function LabelPicker({
  labels,
  selectedIds,
  onSelect,
  onDeselect,
  disabled,
}: LabelPickerProps) {
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
          <Tag className="h-3.5 w-3.5" />
          Label
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-56" align="start">
        <Command>
          <CommandInput placeholder="Search labels..." />
          <CommandList>
            <CommandEmpty>No labels found.</CommandEmpty>
            <CommandGroup>
              {labels.map((label) => {
                const selected = selectedIds.includes(label.id);
                return (
                  <CommandItem
                    key={label.id}
                    value={label.name}
                    onSelect={() => {
                      if (selected) {
                        onDeselect(label.id);
                      } else {
                        onSelect(label.id);
                      }
                    }}
                  >
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1 truncate">{label.name}</span>
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
