import { useState, useCallback, useEffect } from "react";

interface RecentFileEntry {
  id: string;
  name: string;
  mimeType: string | null;
  isFolder: boolean;
  teamFolderId?: string | null;
  accessedAt: number;
}

const MAX_RECENT = 10;

function getStorageKey(wid: string) {
  return `drive-recent-${wid}`;
}

function readRecents(wid: string): RecentFileEntry[] {
  try {
    const raw = localStorage.getItem(getStorageKey(wid));
    return raw ? (JSON.parse(raw) as RecentFileEntry[]) : [];
  } catch {
    return [];
  }
}

function writeRecents(wid: string, entries: RecentFileEntry[]) {
  try {
    localStorage.setItem(getStorageKey(wid), JSON.stringify(entries));
  } catch {
    // Storage full — ignore
  }
}

export function useRecentFiles(wid: string) {
  const [recents, setRecents] = useState<RecentFileEntry[]>(() => readRecents(wid));

  // Re-read on workspace change
  useEffect(() => {
    setRecents(readRecents(wid));
  }, [wid]);

  const addRecent = useCallback(
    (file: { id: string; name: string; mimeType: string | null; isFolder: boolean; teamFolderId?: string | null }) => {
      setRecents((prev) => {
        const entry: RecentFileEntry = {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          isFolder: file.isFolder,
          teamFolderId: file.teamFolderId,
          accessedAt: Date.now(),
        };
        const filtered = prev.filter((r) => r.id !== file.id);
        const next = [entry, ...filtered].slice(0, MAX_RECENT);
        writeRecents(wid, next);
        return next;
      });
    },
    [wid],
  );

  const removeRecent = useCallback(
    (id: string) => {
      setRecents((prev) => {
        const next = prev.filter((r) => r.id !== id);
        writeRecents(wid, next);
        return next;
      });
    },
    [wid],
  );

  return { recents, addRecent, removeRecent };
}
