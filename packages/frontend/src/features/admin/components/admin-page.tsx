import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Settings, Users, UsersRound, Mail, Blocks, Shield } from "lucide-react";
import { GeneralSettings } from "./general-settings";
import { MembersSettings } from "./members-settings";
import { GroupsManager } from "./groups-manager";
import { InviteSettings } from "./invite-settings";
import { ModulesSettings } from "./modules-settings";
import { AuthenticationSettings } from "./authentication-settings";

const tabs = [
  { id: "general", label: "General", icon: Settings },
  { id: "members", label: "Members", icon: Users },
  { id: "groups", label: "Groups", icon: UsersRound },
  { id: "invites", label: "Invites", icon: Mail },
  { id: "modules", label: "Modules", icon: Blocks },
  { id: "authentication", label: "Authentication", icon: Shield },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function AdminPage() {
  const { workspaceSlug } = useParams({ strict: false }) as { workspaceSlug: string };
  const workspaces = useAuthStore((s) => s.workspaces);
  const membership = workspaces.find((w) => w.workspace.slug === workspaceSlug);
  const workspaceId = membership?.workspace.id ?? "";
  const [activeTab, setActiveTab] = useState<TabId>("general");

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-1">Workspace Admin</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your workspace settings, members, and groups.
      </p>

      <div className="border-b mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "general" && <GeneralSettings workspaceId={workspaceId} />}
      {activeTab === "members" && <MembersSettings workspaceId={workspaceId} />}
      {activeTab === "groups" && <GroupsManager workspaceId={workspaceId} />}
      {activeTab === "invites" && <InviteSettings workspaceId={workspaceId} />}
      {activeTab === "modules" && <ModulesSettings workspaceId={workspaceId} />}
      {activeTab === "authentication" && <AuthenticationSettings />}
    </div>
  );
}
