import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useWorkspaceSettings, useUpdateWorkspaceSettings } from "../api";
import { toast } from "sonner";
import { Loader2, HardDrive, BookOpen, Clock, MessageSquare } from "lucide-react";

const MODULES = [
  {
    id: "drive",
    label: "Drive",
    description: "File storage and team folders",
    icon: HardDrive,
  },
  {
    id: "wiki",
    label: "Knowledge",
    description: "Wiki pages and documentation",
    icon: BookOpen,
  },
  {
    id: "time",
    label: "Time Tracking",
    description: "Timesheets and time entries",
    icon: Clock,
  },
  {
    id: "chat",
    label: "Chat",
    description: "Channels, direct messages, and real-time conversations",
    icon: MessageSquare,
  },
] as const;

interface ModulesSettingsProps {
  workspaceId: string;
}

export function ModulesSettings({ workspaceId }: ModulesSettingsProps) {
  const { data: settingsData, isLoading } = useWorkspaceSettings(workspaceId);
  const settings = settingsData?.data;
  const updateSettings = useUpdateWorkspaceSettings(workspaceId);

  type ModuleId = "drive" | "wiki" | "time" | "chat";
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>([
    "drive",
    "wiki",
    "time",
    "chat",
  ]);

  useEffect(() => {
    if (settings) {
      setEnabledModules(settings.enabledModules as ModuleId[]);
    }
  }, [settings]);

  const toggleModule = (moduleId: ModuleId) => {
    setEnabledModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((m) => m !== moduleId)
        : [...prev, moduleId],
    );
  };

  const handleSave = () => {
    updateSettings.mutate(
      { enabledModules },
      {
        onSuccess: () => toast.success("Module settings saved"),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Modules</h2>
        <p className="text-sm text-muted-foreground">
          Enable or disable optional modules for this workspace. Disabling a
          module hides it from navigation — no data is deleted.
        </p>
      </div>

      <div className="space-y-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const enabled = enabledModules.includes(mod.id);
          return (
            <label
              key={mod.id}
              className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => toggleModule(mod.id)}
                className="h-4 w-4 rounded border-input"
              />
              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{mod.label}</div>
                <div className="text-xs text-muted-foreground">
                  {mod.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <Button
        onClick={handleSave}
        disabled={updateSettings.isPending}
        className="w-fit"
      >
        {updateSettings.isPending ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}
