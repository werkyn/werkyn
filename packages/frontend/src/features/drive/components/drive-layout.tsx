import { DriveSidebar, type DriveSection } from "./drive-sidebar";

interface DriveLayoutProps {
  workspaceId: string;
  section: DriveSection;
  activeTeamFolderId?: string;
  onSectionChange: (section: DriveSection) => void;
  onTeamFolderClick: (folderId: string, teamFolderId: string) => void;
  onCreateTeamFolder?: () => void;
  children: React.ReactNode;
}

export function DriveLayout({
  workspaceId,
  section,
  activeTeamFolderId,
  onSectionChange,
  onTeamFolderClick,
  onCreateTeamFolder,
  children,
}: DriveLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <DriveSidebar
        workspaceId={workspaceId}
        activeSection={section}
        activeTeamFolderId={activeTeamFolderId}
        onSectionChange={onSectionChange}
        onTeamFolderClick={onTeamFolderClick}
        onCreateTeamFolder={onCreateTeamFolder}
        className="w-60 border-r shrink-0 overflow-y-auto"
      />
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
