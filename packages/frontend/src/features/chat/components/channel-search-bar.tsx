import { useState, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSearchMessages } from "../api";

interface ChannelSearchBarProps {
  workspaceId: string;
  channelId: string;
  onClose: () => void;
}

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChannelSearchBar({
  workspaceId,
  channelId,
  onClose,
}: ChannelSearchBarProps) {
  const [input, setInput] = useState("");
  const debouncedQuery = useDebounce(input, 300);
  const { data, isLoading } = useSearchMessages(
    workspaceId,
    debouncedQuery,
    channelId,
  );
  const results = data?.data ?? [];

  return (
    <div className="border-b">
      <div className="flex items-center gap-2 px-4 py-2">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search messages..."
          className="h-8 border-0 p-0 focus-visible:ring-0 shadow-none"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {debouncedQuery.length >= 2 && (
        <div className="max-h-64 overflow-y-auto border-t">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground text-center">
              No messages found
            </p>
          ) : (
            <div className="divide-y">
              {results.map((msg) => (
                <div
                  key={msg.id}
                  className="px-4 py-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      displayName={msg.user.displayName}
                      avatarUrl={msg.user.avatarUrl}
                      size="sm"
                    />
                    <span className="text-xs font-medium">
                      {msg.user.displayName}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5 ml-7">
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
