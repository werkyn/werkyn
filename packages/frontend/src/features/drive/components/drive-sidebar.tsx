import { useTeamFolders } from "../api";
import {
  Home,
  HardDrive,
  Share2,
  ArrowUpRight,
  Clock,
  Star,
  Trash2,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type DriveSection =
  | "home"
  | "drive"
  | "shared-with-me"
  | "shared-by-me"
  | "recent"
  | "starred"
  | "trash";

interface DriveSidebarProps {
  workspaceId: string;
  activeSection: DriveSection;
  onSectionChange: (section: DriveSection) => void;
  onTeamFolderClick: (folderId: string, teamFolderId: string) => void;
  className?: string;
}

const NAV_ITEMS: { section: DriveSection; label: string; icon: React.ElementType }[] = [
  { section: "home", label: "Home", icon: Home },
  { section: "drive", label: "My Drive", icon: HardDrive },
  { section: "shared-with-me", label: "Shared with me", icon: Share2 },
  { section: "shared-by-me", label: "Shared by me", icon: ArrowUpRight },
  { section: "recent", label: "Recent", icon: Clock },
  { section: "starred", label: "Starred", icon: Star },
  { section: "trash", label: "Trash", icon: Trash2 },
];

export function DriveSidebar({
  workspaceId,
  activeSection,
  onSectionChange,
  onTeamFolderClick,
  className,
}: DriveSidebarProps) {
  const { data: teamFoldersData } = useTeamFolders(workspaceId);
  const teamFolders = teamFoldersData?.data ?? [];

  return (
    <div className={cn("flex flex-col overflow-y-auto", className)}>
      <div className="px-3 py-4">
        <h2 className="mb-3 px-2 text-sm font-semibold text-foreground">Drive</h2>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map(({ section, label, icon: Icon }) => (
            <button
              key={section}
              onClick={() => onSectionChange(section)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                activeSection === section
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {teamFolders.length > 0 && (
        <div className="border-t px-3 py-4">
          <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Team Folders
          </h3>
          <nav className="space-y-0.5">
            {teamFolders.map((tf) => (
              <button
                key={tf.id}
                onClick={() => onTeamFolderClick(tf.folderId, tf.id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                <Folder className="h-4 w-4 shrink-0" />
                <span className="truncate">{tf.name}</span>
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
