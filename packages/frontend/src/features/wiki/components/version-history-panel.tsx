import { useState } from "react";
import { X, Clock, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useWikiPageVersions,
  useCreateNamedVersion,
  useRestoreVersion,
  type WikiPageVersion,
} from "../api";

interface VersionHistoryPanelProps {
  pageId: string;
  onClose: () => void;
}

export function VersionHistoryPanel({ pageId, onClose }: VersionHistoryPanelProps) {
  const { data: versionsData, isLoading } = useWikiPageVersions(pageId);
  const createVersion = useCreateNamedVersion(pageId);
  const restoreVersion = useRestoreVersion(pageId);
  const [newVersionName, setNewVersionName] = useState("");

  const versions = versionsData?.data ?? [];

  const handleCreateVersion = () => {
    if (!newVersionName.trim()) return;
    createVersion.mutate(
      { name: newVersionName.trim() },
      { onSuccess: () => setNewVersionName("") },
    );
  };

  const handleRestore = (vid: string) => {
    restoreVersion.mutate(vid, { onSuccess: () => onClose() });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 border-l bg-background shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold text-sm">Version History</h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Create named version */}
      <div className="border-b px-4 py-3 space-y-2">
        <p className="text-xs text-muted-foreground">Save a named version</p>
        <div className="flex gap-2">
          <Input
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            placeholder="Version name..."
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateVersion();
              }
            }}
          />
          <Button
            size="sm"
            onClick={handleCreateVersion}
            disabled={!newVersionName.trim() || createVersion.isPending}
          >
            <Save className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : versions.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">
            No versions yet. Versions are auto-saved periodically.
          </p>
        ) : (
          <div className="divide-y">
            {versions.map((version) => (
              <VersionItem
                key={version.id}
                version={version}
                onRestore={() => handleRestore(version.id)}
                isRestoring={restoreVersion.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VersionItem({
  version,
  onRestore,
  isRestoring,
}: {
  version: WikiPageVersion;
  onRestore: () => void;
  isRestoring: boolean;
}) {
  return (
    <div className="px-4 py-3 hover:bg-accent/50 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {version.name ? (
            <p className="text-sm font-medium truncate">{version.name}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Auto-save #{version.versionNumber}
            </p>
          )}
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(version.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            by {version.createdBy.displayName}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRestore}
          disabled={isRestoring}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="Restore this version"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
