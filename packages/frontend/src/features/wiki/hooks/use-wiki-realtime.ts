import { useEffect } from "react";
import { useRealtimeClient } from "@/components/providers/realtime-provider";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export function useWikiRealtime(workspaceId: string) {
  const client = useRealtimeClient();

  useEffect(() => {
    if (!client || !workspaceId) return;

    const onSpaceCreated = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wikiSpaces(workspaceId),
      });
    };

    const onSpaceUpdated = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wikiSpaces(workspaceId),
      });
    };

    const onSpaceDeleted = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.wikiSpaces(workspaceId),
      });
    };

    const onPageCreated = (data: unknown) => {
      const d = data as { page?: { spaceId?: string } };
      if (d?.page?.spaceId) {
        queryClient.invalidateQueries({
          queryKey: ["wiki-pages", { sid: d.page.spaceId }],
        });
      }
    };

    const onPageUpdated = (data: unknown) => {
      const d = data as { page?: { id?: string; spaceId?: string } };
      if (d?.page?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.wikiPage(d.page.id),
        });
      }
      if (d?.page?.spaceId) {
        queryClient.invalidateQueries({
          queryKey: ["wiki-pages", { sid: d.page.spaceId }],
        });
      }
    };

    const onPageDeleted = (data: unknown) => {
      const d = data as { spaceId?: string; pageId?: string };
      if (d?.spaceId) {
        queryClient.invalidateQueries({
          queryKey: ["wiki-pages", { sid: d.spaceId }],
        });
      }
    };

    const onPageMoved = (data: unknown) => {
      const d = data as { page?: { spaceId?: string } };
      // Invalidate all page trees since the page could have moved between spaces
      queryClient.invalidateQueries({ queryKey: ["wiki-pages"] });
    };

    const onPageLocked = (data: unknown) => {
      const d = data as { pageId?: string };
      if (d?.pageId) {
        queryClient.invalidateQueries({
          queryKey: ["wiki-lock", d.pageId],
        });
      }
    };

    const onPageUnlocked = (data: unknown) => {
      const d = data as { pageId?: string };
      if (d?.pageId) {
        queryClient.invalidateQueries({
          queryKey: ["wiki-lock", d.pageId],
        });
      }
    };

    const onCommentCreated = (data: unknown) => {
      const d = data as { pageId?: string };
      if (d?.pageId) {
        queryClient.invalidateQueries({
          queryKey: ["wiki-comments", d.pageId],
        });
      }
    };

    const onCommentResolved = (data: unknown) => {
      const d = data as { comment?: { pageId?: string } };
      if (d?.comment?.pageId) {
        queryClient.invalidateQueries({
          queryKey: ["wiki-comments", d.comment.pageId],
        });
      }
    };

    client.on("wiki_space_created", onSpaceCreated);
    client.on("wiki_space_updated", onSpaceUpdated);
    client.on("wiki_space_deleted", onSpaceDeleted);
    client.on("wiki_page_created", onPageCreated);
    client.on("wiki_page_updated", onPageUpdated);
    client.on("wiki_page_deleted", onPageDeleted);
    client.on("wiki_page_moved", onPageMoved);
    client.on("wiki_page_locked", onPageLocked);
    client.on("wiki_page_unlocked", onPageUnlocked);
    client.on("wiki_comment_created", onCommentCreated);
    client.on("wiki_comment_resolved", onCommentResolved);

    return () => {
      client.off("wiki_space_created", onSpaceCreated);
      client.off("wiki_space_updated", onSpaceUpdated);
      client.off("wiki_space_deleted", onSpaceDeleted);
      client.off("wiki_page_created", onPageCreated);
      client.off("wiki_page_updated", onPageUpdated);
      client.off("wiki_page_deleted", onPageDeleted);
      client.off("wiki_page_moved", onPageMoved);
      client.off("wiki_page_locked", onPageLocked);
      client.off("wiki_page_unlocked", onPageUnlocked);
      client.off("wiki_comment_created", onCommentCreated);
      client.off("wiki_comment_resolved", onCommentResolved);
    };
  }, [client, workspaceId]);
}
