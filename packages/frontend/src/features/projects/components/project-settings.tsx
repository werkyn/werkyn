import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateProjectSchema, type UpdateProjectInput } from "@pm/shared";
import { useProject, useUpdateProject } from "../api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusColumnManager } from "./status-column-manager";
import { LabelManager } from "./label-manager";
import { CustomFieldsManager } from "./custom-fields-manager";
import { MemberManager } from "./member-manager";
import { DangerZone } from "./danger-zone";
import { TemplateManager } from "@/features/templates/components/template-manager";
import { RecurringManager } from "@/features/recurring/components/recurring-manager";

interface ProjectSettingsProps {
  projectId: string;
  workspaceSlug: string;
}

export function ProjectSettings({ projectId, workspaceSlug }: ProjectSettingsProps) {
  const { data, isLoading } = useProject(projectId);
  const project = data?.data;

  const workspaces = useAuthStore((s) => s.workspaces);
  const ws = workspaces.find((w) => w.workspace.slug === workspaceSlug);
  const workspaceId = ws?.workspace.id ?? "";

  const updateProject = useUpdateProject(projectId, workspaceId);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(UpdateProjectSchema),
    values: project
      ? {
          name: project.name,
          description: project.description ?? "",
          color: project.color ?? "",
        }
      : undefined,
  });

  const onSubmit = handleSubmit((data) => {
    updateProject.mutate(data);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-xl font-bold">Project Settings</h1>

      {/* General */}
      <form onSubmit={onSubmit} className="space-y-4">
        <h3 className="text-sm font-semibold">General</h3>

        <div className="space-y-2">
          <Label htmlFor="settings-name">Name</Label>
          <Input id="settings-name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-desc">Description</Label>
          <Input
            id="settings-desc"
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings-color">Color</Label>
          <Input
            id="settings-color"
            type="color"
            className="h-9 w-16 p-1"
            {...register("color")}
          />
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={!isDirty || updateProject.isPending}
        >
          {updateProject.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <div className="border-t" />

      {/* Status Columns */}
      <StatusColumnManager projectId={projectId} />

      <div className="border-t" />

      {/* Labels */}
      <LabelManager projectId={projectId} />

      <div className="border-t" />

      {/* Custom Fields */}
      <CustomFieldsManager projectId={projectId} />

      <div className="border-t" />

      {/* Templates */}
      <TemplateManager projectId={projectId} />

      <div className="border-t" />

      {/* Recurring Tasks */}
      <RecurringManager projectId={projectId} />

      <div className="border-t" />

      {/* Members */}
      <MemberManager projectId={projectId} workspaceId={workspaceId} />

      <div className="border-t" />

      {/* Danger Zone */}
      <DangerZone
        projectId={projectId}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        archived={project.archived}
      />
    </div>
  );
}
