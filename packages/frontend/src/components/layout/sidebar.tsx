import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { usePermissions } from "@/hooks/use-permissions";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  HardDrive,
  Clock,
  Plus,
  PanelLeftClose,
  UserPlus,
} from "lucide-react";
import { WikiSpaceSidebarItem } from "@/features/wiki/components/wiki-space-sidebar-item";
import type { WikiSpace } from "@/features/wiki/api";
import { InviteDialog } from "@/features/workspaces/components/invite-dialog";
import { useState } from "react";

interface SidebarProps {
  projects?: Array<{ id: string; name: string; color: string | null; icon: string | null }>;
  wikiSpaces?: WikiSpace[];
  enabledModules?: string[];
  onCreateProject?: () => void;
}

export function Sidebar({ projects = [], wikiSpaces = [], enabledModules = ["drive", "wiki", "time"], onCreateProject }: SidebarProps) {
  const { workspaceSlug } = useParams({ strict: false }) as { workspaceSlug: string };
  const { projectId } = useParams({ strict: false }) as { projectId?: string };
  const workspaces = useAuthStore((s) => s.workspaces);
  const user = useAuthStore((s) => s.user);
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);

  const membership = workspaces.find((w) => w.workspace.slug === workspaceSlug);
  const permissions = usePermissions(membership, user?.id);
  const workspaceId = membership?.workspace.id;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-background transition-all duration-200",
        collapsed ? "w-0 overflow-hidden" : "w-64",
      )}
    >
      <div className="flex items-center justify-between p-3 border-b">
        <WorkspaceSwitcher currentSlug={workspaceSlug} />
        <div className="flex items-center gap-1">
          {permissions.canManageWorkspace && (
            <button
              onClick={() => setInviteOpen(true)}
              className="rounded-md p-1 hover:bg-accent transition-colors"
              aria-label="Invite members"
            >
              <UserPlus className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={toggle}
            className="rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link
          to="/$workspaceSlug"
          params={{ workspaceSlug }}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          activeProps={{ className: "bg-accent font-medium" }}
          activeOptions={{ exact: true }}
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>

        <Link
          to="/$workspaceSlug/my-tasks"
          params={{ workspaceSlug }}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          activeProps={{ className: "bg-accent font-medium" }}
        >
          <CheckSquare className="h-4 w-4" />
          My Tasks
        </Link>

        {enabledModules.includes("drive") && (
          <Link
            to="/$workspaceSlug/drive"
            params={{ workspaceSlug }}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            activeProps={{ className: "bg-accent font-medium" }}
          >
            <HardDrive className="h-4 w-4" />
            Drive
          </Link>
        )}

        {enabledModules.includes("time") && (
          <Link
            to="/$workspaceSlug/time"
            params={{ workspaceSlug }}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            activeProps={{ className: "bg-accent font-medium" }}
          >
            <Clock className="h-4 w-4" />
            Time
          </Link>
        )}

        <div className="pt-4">
          <div className="flex items-center justify-between px-2 pb-1">
            <Link
              to="/$workspaceSlug/projects"
              params={{ workspaceSlug }}
              className="text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              Projects
            </Link>
            {permissions.canCreate && (
              <button
                onClick={onCreateProject}
                className="rounded p-0.5 hover:bg-accent transition-colors"
                aria-label="New project"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {projects.map((project) => (
            <Link
              key={project.id}
              to="/$workspaceSlug/projects/$projectId/board"
              params={{ workspaceSlug, projectId: project.id }}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                projectId === project.id && "bg-accent font-medium",
              )}
            >
              <div
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: project.color ?? "#6366f1" }}
              />
              <span className="truncate">{project.name}</span>
            </Link>
          ))}

          {projects.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              No projects yet
            </p>
          )}
        </div>

        {enabledModules.includes("wiki") && (
          <div className="pt-4">
            <div className="px-2 pb-1">
              <Link
                to="/$workspaceSlug/knowledge"
                params={{ workspaceSlug }}
                className="text-xs font-semibold uppercase text-muted-foreground hover:text-foreground transition-colors"
                activeProps={{ className: "text-foreground" }}
              >
                Knowledge
              </Link>
            </div>

            {wikiSpaces.map((space) => (
              <WikiSpaceSidebarItem
                key={space.id}
                space={space}
                onPageClick={(pageId, spaceId) => {
                  navigate({
                    to: "/$workspaceSlug/knowledge",
                    params: { workspaceSlug },
                    search: { spaceId, pageId },
                  });
                }}
              />
            ))}

            {wikiSpaces.length === 0 && (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No spaces yet
              </p>
            )}
          </div>
        )}
      </nav>

      {workspaceId && (
        <InviteDialog
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          workspaceId={workspaceId}
        />
      )}
    </aside>
  );
}
