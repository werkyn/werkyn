import { useState, useMemo, useCallback } from "react";
import { ChannelList } from "./channel-list";
import { ChannelHeader } from "./channel-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ThreadPanel } from "./thread-panel";
import { TypingIndicator } from "./typing-indicator";
import { ChannelSettingsDialog } from "./channel-settings-dialog";
import { CreateChannelDialog } from "./create-channel-dialog";
import { DmUserPicker } from "./dm-user-picker";
import {
  useChannels,
  useChannel,
  useMessages,
  useSendMessage,
  useUpdateMessage,
  useDeleteMessage,
  useUnreadCounts,
  useMarkRead,
  useFindOrCreateDm,
  useJoinChannel,
  useSendTyping,
  useToggleReaction,
  type ChatMessage,
  type ChatChannel,
} from "../api";
import { useChatRealtime } from "../hooks/use-chat-realtime";
import { useTypingIndicator } from "../hooks/use-typing-indicator";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, MessageSquare } from "lucide-react";

interface ChatLayoutProps {
  workspaceId: string;
  channelId?: string;
  currentUserId: string;
  isAdmin?: boolean;
  workspaceMembers?: Array<{
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  }>;
  onChannelSelect: (channelId: string) => void;
}

export function ChatLayout({
  workspaceId,
  channelId,
  currentUserId,
  isAdmin,
  workspaceMembers = [],
  onChannelSelect,
}: ChatLayoutProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [dmPickerOpen, setDmPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [threadMessage, setThreadMessage] = useState<ChatMessage | null>(null);

  // Data queries
  const { data: channelsData, isLoading: channelsLoading } = useChannels(workspaceId);
  const channels = channelsData?.data ?? [];

  const { data: channelData } = useChannel(workspaceId, channelId ?? "");
  const channel = channelData?.data;

  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(workspaceId, channelId ?? "");

  const messages = useMemo(
    () => messagesData?.pages.flatMap((p) => p.data) ?? [],
    [messagesData],
  );

  const { data: unreadData } = useUnreadCounts(workspaceId);
  const unreadCounts = unreadData?.data ?? [];

  const markRead = useMarkRead(workspaceId, channelId ?? "");
  const sendMessage = useSendMessage(workspaceId, channelId ?? "");
  const updateMessage = useUpdateMessage(workspaceId);
  const deleteMessage = useDeleteMessage(workspaceId);
  const sendTyping = useSendTyping(workspaceId, channelId ?? "");
  const findOrCreateDm = useFindOrCreateDm(workspaceId);
  const joinChannel = useJoinChannel(workspaceId);
  const toggleReaction = useToggleReaction(workspaceId, channelId ?? "");

  // Typing indicator
  const { typingUsers, handleTyping } = useTypingIndicator(currentUserId);

  // Realtime
  useChatRealtime(workspaceId, channelId, handleTyping);

  // Build DM members map for display
  const dmMembers = useMemo(() => {
    const map: Record<string, Array<{ id: string; displayName: string; avatarUrl: string | null }>> = {};
    for (const ch of channels) {
      if (ch.type === "DM" && ch.members) {
        map[ch.id] = ch.members.map((m) => ({
          id: m.user.id,
          displayName: m.user.displayName,
          avatarUrl: m.user.avatarUrl,
        }));
      }
    }
    return map;
  }, [channels]);

  // Mark read when viewing a channel
  const handleChannelSelect = useCallback(
    (id: string) => {
      onChannelSelect(id);
      // Small delay to ensure navigation happens first
      setTimeout(() => {
        markRead.mutate();
      }, 500);
    },
    [onChannelSelect, markRead],
  );

  const handleSend = useCallback(
    (content: string) => {
      sendMessage.mutate(
        { content },
        {
          onSuccess: () => markRead.mutate(),
        },
      );
    },
    [sendMessage, markRead],
  );

  const handleEdit = useCallback(
    (messageId: string, content: string) => {
      if (!channelId) return;
      updateMessage.mutate({ messageId, content, channelId });
    },
    [updateMessage, channelId],
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      if (!channelId) return;
      deleteMessage.mutate({ messageId, channelId });
    },
    [deleteMessage, channelId],
  );

  const handleCreateDm = useCallback(
    (userIds: string[]) => {
      findOrCreateDm.mutate(
        { userIds },
        {
          onSuccess: (res) => {
            setDmPickerOpen(false);
            onChannelSelect(res.data.id);
          },
        },
      );
    },
    [findOrCreateDm, onChannelSelect],
  );

  const handleThreadClick = useCallback(
    (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (msg) setThreadMessage(msg);
    },
    [messages],
  );

  const handleReaction = useCallback(
    (messageId: string, emoji: string) => {
      toggleReaction.mutate({ messageId, emoji });
    },
    [toggleReaction],
  );

  return (
    <div className="flex h-full">
      {/* Channel sidebar */}
      <div className="w-60 border-r shrink-0">
        {channelsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChannelList
            channels={channels}
            activeChannelId={channelId}
            unreadCounts={unreadCounts}
            currentUserId={currentUserId}
            dmMembers={dmMembers}
            onChannelClick={handleChannelSelect}
            onCreateChannel={() => setCreateOpen(true)}
            onCreateDm={() => setDmPickerOpen(true)}
          />
        )}
      </div>

      {/* Message area */}
      <div className="flex flex-1 min-w-0">
        {channel && channelId ? (
          <div className="flex flex-col flex-1 min-w-0">
            <ChannelHeader
              channel={channel}
              onSettingsClick={
                channel.type !== "DM"
                  ? () => setSettingsOpen(true)
                  : undefined
              }
            />

            {messagesLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                activeThreadId={threadMessage?.id}
                hasMore={hasNextPage}
                isFetchingMore={isFetchingNextPage}
                onLoadMore={() => fetchNextPage()}
                onThreadClick={handleThreadClick}
                onEditMessage={handleEdit}
                onDeleteMessage={handleDelete}
                onReaction={handleReaction}
              />
            )}

            <TypingIndicator typingUsers={typingUsers} />

            {channel.isMember === false ? (
              <div className="flex items-center justify-center gap-3 border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Join this channel to send messages
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    joinChannel.mutate(channelId!, {
                      onSuccess: () => markRead.mutate(),
                    });
                  }}
                  disabled={joinChannel.isPending}
                >
                  <LogIn className="h-4 w-4 mr-1.5" />
                  {joinChannel.isPending ? "Joining..." : "Join Channel"}
                </Button>
              </div>
            ) : (
              <MessageInput
                onSend={handleSend}
                onTyping={() => sendTyping.mutate()}
                disabled={sendMessage.isPending}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-3" />
            <p className="text-sm">Select a channel to start chatting</p>
          </div>
        )}

        {/* Thread panel */}
        {threadMessage && channelId && (
          <ThreadPanel
            workspaceId={workspaceId}
            channelId={channelId}
            parentMessage={threadMessage}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            onClose={() => setThreadMessage(null)}
            onEditMessage={handleEdit}
            onDeleteMessage={handleDelete}
          />
        )}
      </div>

      {/* Dialogs */}
      <CreateChannelDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        workspaceId={workspaceId}
        onCreated={onChannelSelect}
      />

      <DmUserPicker
        open={dmPickerOpen}
        onClose={() => setDmPickerOpen(false)}
        members={workspaceMembers}
        currentUserId={currentUserId}
        onSubmit={handleCreateDm}
        loading={findOrCreateDm.isPending}
      />

      {channel && channel.type !== "DM" && (
        <ChannelSettingsDialog
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          workspaceId={workspaceId}
          channel={channel}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          workspaceMembers={workspaceMembers}
          onDeleted={() => onChannelSelect("")}
        />
      )}
    </div>
  );
}
