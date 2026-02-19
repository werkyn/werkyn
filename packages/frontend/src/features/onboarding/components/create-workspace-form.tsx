import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateWorkspaceSchema, type CreateWorkspaceInput } from "@pm/shared";
import { useCreateWorkspace } from "@/features/workspaces/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";

export function CreateWorkspaceForm() {
  const createWorkspace = useCreateWorkspace();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(CreateWorkspaceSchema),
    defaultValues: { name: "", slug: "" },
  });

  const name = watch("name");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue("name", value);
    // Auto-generate slug from name
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setValue("slug", slug);
  };

  const onSubmit = handleSubmit((data) => {
    createWorkspace.mutate(data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          placeholder="My Team"
          {...register("name")}
          onChange={handleNameChange}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL slug</Label>
        <Input
          id="slug"
          placeholder="my-team"
          {...register("slug")}
        />
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      {createWorkspace.isError && (
        <p className="text-sm text-destructive">
          {createWorkspace.error instanceof ApiError
            ? createWorkspace.error.message
            : "Failed to create workspace"}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={createWorkspace.isPending}
      >
        {createWorkspace.isPending ? "Creating..." : "Create workspace"}
      </Button>
    </form>
  );
}
