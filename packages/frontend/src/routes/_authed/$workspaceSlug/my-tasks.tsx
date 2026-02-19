import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth-store";
import { MyTasksPage } from "@/features/my-tasks/components/my-tasks-page";
import { TaskSlideover } from "@/features/tasks/components/task-slideover";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";

const myTasksSearchSchema = z.object({
  task: z.string().optional(),
});

export const Route = createFileRoute("/_authed/$workspaceSlug/my-tasks")({
  validateSearch: myTasksSearchSchema,
  component: MyTasksRoute,
});

function MyTasksRoute() {
  const { workspaceSlug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const workspaces = useAuthStore((s) => s.workspaces);
  const workspace = workspaces.find(
    (w) => w.workspace.slug === workspaceSlug,
  )?.workspace;

  useWorkspaceRealtime(workspace?.id);

  const openTask = (taskId: string) => {
    navigate({
      search: (prev) => ({ ...prev, task: taskId }),
    });
  };

  const closeTask = () => {
    navigate({
      search: (prev) => {
        const { task: _, ...rest } = prev;
        return rest;
      },
    });
  };

  if (!workspace) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <MyTasksPage
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        onTaskClick={openTask}
      />

      {search.task && (
        <TaskSlideover
          taskId={search.task}
          workspaceSlug={workspaceSlug}
          onClose={closeTask}
        />
      )}
    </>
  );
}
