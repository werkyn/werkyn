import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { useSearch, type SearchResult, type WikiSearchResult } from "../api";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceSlug: string;
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-500 text-white",
  HIGH: "bg-orange-500 text-white",
  MEDIUM: "bg-yellow-500 text-white",
  LOW: "bg-blue-500 text-white",
};

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function SearchCommand({
  open,
  onOpenChange,
  workspaceId,
  workspaceSlug,
}: SearchCommandProps) {
  const [input, setInput] = useState("");
  const debouncedQuery = useDebounce(input, 300);
  const navigate = useNavigate();

  const { data, isLoading } = useSearch(workspaceId, debouncedQuery);
  const results = data?.data ?? [];
  const wikiPages = data?.wikiPages ?? [];

  // Group results by project
  const grouped = results.reduce<
    Record<string, { project: { id: string; name: string; color: string | null }; tasks: SearchResult[] }>
  >((acc, task) => {
    const pid = task.project.id;
    if (!acc[pid]) {
      acc[pid] = { project: task.project, tasks: [] };
    }
    acc[pid].tasks.push(task);
    return acc;
  }, {});

  const handleSelect = useCallback(
    (task: SearchResult) => {
      onOpenChange(false);
      setInput("");
      navigate({
        to: "/$workspaceSlug/projects/$projectId/board",
        params: { workspaceSlug, projectId: task.project.id },
        search: { task: task.id },
      });
    },
    [navigate, workspaceSlug, onOpenChange],
  );

  const handleSelectWikiPage = useCallback(
    (page: WikiSearchResult) => {
      onOpenChange(false);
      setInput("");
      navigate({
        to: "/$workspaceSlug/knowledge",
        params: { workspaceSlug },
        search: { spaceId: page.spaceId, pageId: page.id },
      });
    },
    [navigate, workspaceSlug, onOpenChange],
  );

  // Reset input on close
  useEffect(() => {
    if (!open) setInput("");
  }, [open]);

  const hasResults = results.length > 0 || wikiPages.length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search across tasks and knowledge pages"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Search tasks and pages..."
        value={input}
        onValueChange={setInput}
      />
      <CommandList>
        {debouncedQuery.length >= 2 && !isLoading && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {debouncedQuery.length < 2 && (
          <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
        )}

        {/* Wiki Pages */}
        {wikiPages.length > 0 && (
          <CommandGroup heading="Knowledge Pages">
            {wikiPages.map((page) => (
              <CommandItem
                key={`wiki-${page.id}`}
                value={`wiki ${page.title} ${page.space.name}`}
                onSelect={() => handleSelectWikiPage(page)}
                className="flex items-center gap-2"
              >
                {page.icon ? (
                  <span className="text-sm shrink-0">{page.icon}</span>
                ) : (
                  <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{page.title}</span>
                <Badge variant="secondary" className="text-[10px] px-1">
                  {page.space.icon ?? ""} {page.space.name}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Tasks grouped by project */}
        {Object.entries(grouped).map(([pid, group]) => (
          <CommandGroup
            key={pid}
            heading={group.project.name}
          >
            {group.tasks.map((task) => (
              <CommandItem
                key={task.id}
                value={`${task.title} ${task.project.name}`}
                onSelect={() => handleSelect(task)}
                className="flex items-center gap-2"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: group.project.color ?? "#6366f1" }}
                />
                <span className="flex-1 truncate">{task.title}</span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1 ${priorityColors[task.priority] ?? ""}`}
                >
                  {task.priority}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
