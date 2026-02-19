import { useRef, useEffect } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";

export interface MemberOption {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface MentionDropdownProps {
  members: MemberOption[];
  onSelect: (member: MemberOption) => void;
  selectedIndex: number;
}

export function MentionDropdown({
  members,
  onSelect,
  selectedIndex,
}: MentionDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (members.length === 0) return null;

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 z-50 mb-1 max-h-40 w-56 overflow-y-auto rounded-md border bg-popover shadow-md"
    >
      {members.map((member, i) => (
        <button
          key={member.id}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(member);
          }}
          className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors ${
            i === selectedIndex ? "bg-accent" : ""
          }`}
        >
          <UserAvatar
            displayName={member.displayName}
            avatarUrl={member.avatarUrl}
            size="sm"
          />
          <span className="truncate">{member.displayName}</span>
        </button>
      ))}
    </div>
  );
}
