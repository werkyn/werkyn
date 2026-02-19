import { useMemo } from "react";

interface WorkspaceMembership {
  role: "ADMIN" | "MEMBER" | "VIEWER";
}

interface TaskLike {
  assignees?: Array<{ userId: string } | { user: { id: string } }>;
}

export function usePermissions(membership: WorkspaceMembership | undefined, userId?: string) {
  return useMemo(() => {
    const role = membership?.role;

    const isAdmin = role === "ADMIN";
    const isMember = role === "MEMBER";
    const isViewer = role === "VIEWER";

    return {
      role,
      isViewer,
      canEdit: isAdmin || isMember,
      canCreate: isAdmin || isMember,
      canDelete: isAdmin,
      canManageProject: isAdmin,
      canManageWorkspace: isAdmin,
      canComment: isAdmin || isMember,
      canEditTask: (task: TaskLike) => {
        if (isAdmin) return true;
        if (!isMember || !userId) return false;
        return (
          task.assignees?.some((a) => {
            if ("userId" in a) return a.userId === userId;
            if ("user" in a) return a.user.id === userId;
            return false;
          }) ?? false
        );
      },
    };
  }, [membership, userId]);
}
