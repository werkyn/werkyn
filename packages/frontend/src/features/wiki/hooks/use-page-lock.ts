import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import {
  useWikiPageLock,
  useAcquireWikiLock,
  useReleaseWikiLock,
  useHeartbeatWikiLock,
} from "../api";

export function usePageLock(pageId: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const { data: lockData, refetch } = useWikiPageLock(pageId);
  const acquireLock = useAcquireWikiLock(pageId);
  const releaseLock = useReleaseWikiLock(pageId);
  const heartbeat = useHeartbeatWikiLock(pageId);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const lock = lockData?.data ?? null;
  const isLockedByMe = lock?.userId === userId;
  const isLockedByOther = lock !== null && lock.userId !== userId;

  const acquire = useCallback(() => {
    acquireLock.mutate(undefined, {
      onSuccess: () => {
        // Start heartbeat
        if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = setInterval(() => {
          heartbeat.mutate();
        }, 30000);
      },
    });
  }, [acquireLock, heartbeat]);

  const release = useCallback(() => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    releaseLock.mutate();
  }, [releaseLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (isLockedByMe) {
        releaseLock.mutate();
      }
    };
  }, [pageId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    lock,
    isLockedByMe,
    isLockedByOther,
    acquire,
    release,
    refetch,
  };
}
