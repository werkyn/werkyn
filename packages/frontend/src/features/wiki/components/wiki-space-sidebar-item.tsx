import { useState, useRef, useEffect } from "react";
import { ChevronRight, BookOpen, Plus, Pencil, Smile, Trash2, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useWikiPageTree,
  useCreateWikiPage,
  useUpdateWikiSpace,
  useDeleteWikiSpace,
  type WikiSpace,
} from "../api";
import { WikiPageTreeItem } from "./wiki-page-tree-item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/components/shared/emoji-picker";

interface WikiSpaceSidebarItemProps {
  space: WikiSpace;
  activePageId?: string;
  onPageClick: (pageId: string, spaceId: string) => void;
}

export function WikiSpaceSidebarItem({
  space,
  activePageId,
  onPageClick,
}: WikiSpaceSidebarItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(space.name);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const renameRef = useRef<HTMLInputElement>(null);

  const { data: pagesData } = useWikiPageTree(
    expanded ? space.id : "",
  );
  const pages = pagesData?.data ?? [];

  const createPage = useCreateWikiPage(space.id);
  const updateSpace = useUpdateWikiSpace(space.id, space.workspaceId);
  const deleteSpace = useDeleteWikiSpace(space.workspaceId);

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== space.name) {
      updateSpace.mutate({ name: trimmed });
    }
    setIsRenaming(false);
  };

  const handleNewPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    createPage.mutate(
      { title: "Untitled" },
      {
        onSuccess: (res) => {
          setExpanded(true);
          onPageClick(res.data.id, space.id);
        },
      },
    );
  };

  const handleDelete = () => {
    deleteSpace.mutate(space.id);
  };

  return (
    <div>
      <div className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-accent transition-colors group">
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              expanded && "rotate-90",
            )}
          />
        </button>

        {space.icon ? (
          <span className="shrink-0 text-sm">{space.icon}</span>
        ) : (
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}

        {isRenaming ? (
          <input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameSubmit();
              if (e.key === "Escape") {
                setRenameValue(space.name);
                setIsRenaming(false);
              }
            }}
            className="flex-1 bg-transparent outline-none text-sm border border-ring rounded px-1"
          />
        ) : (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 text-left truncate"
          >
            {space.name}
          </button>
        )}

        {!isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleNewPage}
              className="rounded p-0.5 hover:bg-accent"
              title="New page"
            >
              <Plus className="h-3 w-3 text-muted-foreground" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="rounded p-0.5 hover:bg-accent"
                >
                  <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    setRenameValue(space.name);
                    setIsRenaming(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => {
                  setTimeout(() => setShowEmojiPicker(true), 150);
                }}>
                  <Smile className="h-3.5 w-3.5 mr-2" />
                  Change icon
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <EmojiPicker
              value={space.icon ?? null}
              onChange={(emoji) => {
                updateSpace.mutate({ icon: emoji });
                setShowEmojiPicker(false);
              }}
              open={showEmojiPicker}
              onOpenChange={setShowEmojiPicker}
            />
          </div>
        )}
      </div>

      {expanded && (
        <div className="ml-1">
          {pages.map((page) => (
            <WikiPageTreeItem
              key={page.id}
              page={page}
              activePageId={activePageId}
              onPageClick={(pgid) => onPageClick(pgid, space.id)}
            />
          ))}
          {pages.length === 0 && (
            <p className="px-6 py-1.5 text-xs text-muted-foreground">
              No pages yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
