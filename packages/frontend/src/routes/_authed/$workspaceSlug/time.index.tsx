import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TimesheetPage } from "@/features/time/components/timesheet-page";

const timeSearchSchema = z.object({
  week: z.string().optional(),
  userId: z.string().optional(),
  view: z.enum(["my", "all"]).optional(),
});

export const Route = createFileRoute("/_authed/$workspaceSlug/time/")({
  validateSearch: timeSearchSchema,
  component: TimesheetRoute,
});

function TimesheetRoute() {
  const { workspace, membership } = Route.useRouteContext();
  const search = Route.useSearch();

  return (
    <TimesheetPage
      workspaceId={workspace.id}
      workspaceSlug={Route.useParams().workspaceSlug}
      membership={membership}
      week={search.week}
      userId={search.userId}
      view={search.view}
    />
  );
}
