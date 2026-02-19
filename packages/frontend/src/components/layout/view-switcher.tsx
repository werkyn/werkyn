import { cn } from "@/lib/utils";
import { LayoutGrid, List, Calendar } from "lucide-react";

type View = "board" | "list" | "calendar";

interface ViewSwitcherProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const views: { id: View; label: string; icon: typeof LayoutGrid }[] = [
  { id: "board", label: "Board", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-md border p-0.5">
      {views.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          className={cn(
            "flex items-center gap-1.5 rounded px-2.5 py-1 text-sm transition-colors",
            currentView === id
              ? "bg-accent font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
