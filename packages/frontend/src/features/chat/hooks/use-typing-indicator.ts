import { useState, useCallback, useRef } from "react";

interface TypingUser {
  userId: string;
  displayName: string;
}

export function useTypingIndicator(currentUserId: string | undefined) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleTyping = useCallback(
    (userId: string, displayName: string) => {
      if (userId === currentUserId) return;

      // Clear existing timer for this user
      const existing = timers.current.get(userId);
      if (existing) clearTimeout(existing);

      // Add user to typing list
      setTypingUsers((prev) => {
        const filtered = prev.filter((u) => u.userId !== userId);
        return [...filtered, { userId, displayName }];
      });

      // Auto-expire after 4 seconds
      const timer = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        timers.current.delete(userId);
      }, 4000);

      timers.current.set(userId, timer);
    },
    [currentUserId],
  );

  return { typingUsers, handleTyping };
}
