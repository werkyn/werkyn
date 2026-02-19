import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TimeReportsPage } from "@/features/time/components/time-reports-page";

const reportsSearchSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userIds: z.string().optional(),
  projectIds: z.string().optional(),
  billable: z.enum(["true", "false", "all"]).optional(),
  groupBy: z.enum(["user", "project", "date"]).optional(),
});

export const Route = createFileRoute(
  "/_authed/$workspaceSlug/time/reports",
)({
  validateSearch: reportsSearchSchema,
  component: TimeReportsRoute,
});

function TimeReportsRoute() {
  const { workspace, membership } = Route.useRouteContext();
  const search = Route.useSearch();

  return (
    <TimeReportsPage
      workspaceId={workspace.id}
      workspaceSlug={Route.useParams().workspaceSlug}
      membership={membership}
      filters={search}
    />
  );
}
