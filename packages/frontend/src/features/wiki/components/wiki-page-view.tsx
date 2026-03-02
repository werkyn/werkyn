import { useCallback, useRef, useState } from "react";
import { ChevronRight, FileText, History, Lock, MessageSquare, Share2, Smile } from "lucide-react";
import { EmojiPicker } from "@/components/shared/emoji-picker";
import {
  useWikiPage,
  useUpdateWikiPage,
  useWikiPageBreadcrumbs,
} from "../api";
import { WikiEditor } from "./wiki-editor";
import { VersionHistoryPanel } from "./version-history-panel";
import { WikiCommentsPanel } from "./wiki-comments-panel";
import { SharePageDialog } from "./share-page-dialog";
import { usePageLock } from "../hooks/use-page-lock";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Block } from "@blocknote/core";

interface WikiPageViewProps {
  pageId: string;
  workspaceId: string;
  onNavigatePage: (pageId: string) => void;
}

export function WikiPageView({ pageId, workspaceId, onNavigatePage }: WikiPageViewProps) {
  const { data: pageData, isLoading } = useWikiPage(pageId);
  const { data: breadcrumbsData } = useWikiPageBreadcrumbs(pageId);
  const updatePage = useUpdateWikiPage(pageId);
  const { lock, isLockedByMe, isLockedByOther, acquire, release } = usePageLock(pageId);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const page = pageData?.data;
  const breadcrumbs = breadcrumbsData?.data ?? [];

  const readOnly = !isLockedByMe;

  // Debounced auto-save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContentChange = useCallback(
    (content: Block[]) => {
      if (saveTimer.current !== null) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        updatePage.mutate({ content });
      }, 800);
    },
    [updatePage],
  );

  const handleTitleBlur = useCallback(
    (e: React.FocusEvent<HTMLHeadingElement>) => {
      if (readOnly) return;
      const title = e.currentTarget.textContent?.trim();
      if (title && title !== page?.title) {
        updatePage.mutate({ title });
      }
    },
    [updatePage, page?.title, readOnly],
  );

  const handleStartEditing = () => {
    acquire();
  };

  const handleStopEditing = () => {
    release();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-8 space-y-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Page not found
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      {/* Breadcrumbs (ancestors only, current page shown as h1 below) */}
      {breadcrumbs.length > 1 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          {breadcrumbs.slice(0, -1).map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <button
                onClick={() => onNavigatePage(crumb.id)}
                className="hover:text-foreground transition-colors"
              >
                {crumb.icon ? (
                  <span className="mr-1">{crumb.icon}</span>
                ) : (
                  <FileText className="inline h-3 w-3 mr-1" />
                )}
                {crumb.title}
              </button>
            </span>
          ))}
        </nav>
      )}

      {/* Lock banner */}
      {isLockedByOther && lock && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
          <Lock className="h-4 w-4 shrink-0" />
          Being edited by {lock.user.displayName}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {!isLockedByMe && !isLockedByOther && (
            <Button size="sm" variant="outline" onClick={handleStartEditing}>
              <Lock className="h-3.5 w-3.5 mr-1" />
              Start Editing
            </Button>
          )}
          {isLockedByMe && (
            <Button size="sm" variant="outline" onClick={handleStopEditing}>
              Done Editing
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowShare(true)}
          >
            <Share2 className="h-3.5 w-3.5 mr-1" />
            Share
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setShowComments(!showComments); setShowVersions(false); }}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Comments
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setShowVersions(!showVersions); setShowComments(false); }}
          >
            <History className="h-3.5 w-3.5 mr-1" />
            History
          </Button>
        </div>
      </div>

      {/* Icon */}
      <div className="mb-2 group/icon">
        {page.icon ? (
          <EmojiPicker
            value={page.icon}
            onChange={(emoji) => updatePage.mutate({ icon: emoji })}
          >
            <button
              type="button"
              className="text-5xl leading-none rounded-md hover:bg-accent/50 p-1 transition-colors"
            >
              {page.icon}
            </button>
          </EmojiPicker>
        ) : (
          !readOnly && (
            <EmojiPicker
              value={null}
              onChange={(emoji) => emoji && updatePage.mutate({ icon: emoji })}
            >
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground opacity-0 group-hover/icon:opacity-100 hover:bg-accent transition-all"
              >
                <Smile className="h-4 w-4" />
                Add icon
              </button>
            </EmojiPicker>
          )
        )}
      </div>

      {/* Title */}
      <h1
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onBlur={handleTitleBlur}
        className="text-3xl font-bold outline-none mb-1 empty:before:content-['Untitled'] empty:before:text-muted-foreground"
      >
        {page.title}
      </h1>

      {/* Meta info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        {page.lastEditedBy && (
          <span>
            Last edited by {page.lastEditedBy.displayName}
          </span>
        )}
        <span>
          {new Date(page.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Editor */}
      <WikiEditor
        key={pageId}
        initialContent={page.content}
        readOnly={readOnly}
        workspaceId={workspaceId}
        spaceId={page.spaceId}
        onChange={handleContentChange}
      />

      {/* Version History Panel */}
      {showVersions && (
        <VersionHistoryPanel
          pageId={pageId}
          onClose={() => setShowVersions(false)}
        />
      )}

      {/* Comments Panel */}
      {showComments && (
        <WikiCommentsPanel
          pageId={pageId}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* Share Dialog */}
      <SharePageDialog
        open={showShare}
        onClose={() => setShowShare(false)}
        pageId={pageId}
      />
    </div>
  );
}
