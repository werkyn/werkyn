import { useState, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { ChevronDown, Plus } from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";

interface WorkspaceSwitcherProps {
  currentSlug: string;
}

export function WorkspaceSwitcher({ currentSlug }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const workspaces = useAuthStore((s) => s.workspaces);

  const current = workspaces.find((w) => w.workspace.slug === currentSlug);

  useClickOutside(ref, useCallback(() => setOpen(false), []));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-accent transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
          {current?.workspace.name.charAt(0).toUpperCase() ?? "?"}
        </div>
        <span className="truncate">{current?.workspace.name ?? "Select workspace"}</span>
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
          {workspaces.map((w) => (
            <button
              key={w.workspace.id}
              onClick={() => {
                navigate({ to: "/$workspaceSlug", params: { workspaceSlug: w.workspace.slug } });
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors",
                w.workspace.slug === currentSlug && "bg-accent",
              )}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-[9px] font-bold text-primary-foreground">
                {w.workspace.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{w.workspace.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{w.role}</span>
            </button>
          ))}
          <div className="my-1 border-t" />
          <button
            onClick={() => {
              navigate({ to: "/onboarding" as string });
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create workspace</span>
          </button>
        </div>
      )}
    </div>
  );
}
