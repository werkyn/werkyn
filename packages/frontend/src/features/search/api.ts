import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Task } from "@/features/tasks/api";

interface SearchResult extends Task {
  project: { id: string; name: string; color: string | null };
}

interface WikiSearchResult {
  id: string;
  title: string;
  icon: string | null;
  spaceId: string;
  updatedAt: string;
  space: { id: string; name: string; icon: string | null };
}

interface ChatSearchResult {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; displayName: string; avatarUrl: string | null };
  channel: { id: string; name: string | null; type: string };
}

interface SearchResponse {
  data: SearchResult[];
  wikiPages: WikiSearchResult[];
  chatMessages?: ChatSearchResult[];
}

export function useSearch(wid: string, query: string) {
  return useQuery({
    queryKey: queryKeys.search(wid, query),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/search`, {
          searchParams: { q: query },
        })
        .json<SearchResponse>(),
    enabled: !!wid && query.length >= 2,
    staleTime: 10_000,
  });
}

export type { SearchResult, WikiSearchResult, ChatSearchResult };
