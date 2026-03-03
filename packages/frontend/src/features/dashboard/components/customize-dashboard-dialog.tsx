import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  useDashboardPreferences,
  useUpdateDashboardPreferences,
} from "../api";
import type { WidgetConfigItem } from "../api";
import { GRID_WIDGETS, DEFAULT_WIDGET_ORDER } from "../widget-registry";

interface CustomizeDashboardDialogProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export function CustomizeDashboardDialog({
  open,
  onClose,
  workspaceId,
}: CustomizeDashboardDialogProps) {
  const { data: prefData } = useDashboardPreferences(workspaceId);
  const updatePrefs = useUpdateDashboardPreferences(workspaceId);
  const [items, setItems] = useState<WidgetConfigItem[]>(DEFAULT_WIDGET_ORDER);

  useEffect(() => {
    if (open) {
      const saved = prefData?.data?.widgetOrder;
      if (saved && saved.length > 0) {
        // Merge saved prefs with registry to handle new widgets
        const savedMap = new Map(saved.map((w) => [w.id, w.enabled]));
        const merged: WidgetConfigItem[] = [];
        // First add saved items that still exist in registry
        for (const s of saved) {
          if (GRID_WIDGETS.some((gw) => gw.id === s.id)) {
            merged.push({ id: s.id, enabled: s.enabled });
          }
        }
        // Then add any new widgets not in saved prefs
        for (const gw of GRID_WIDGETS) {
          if (!savedMap.has(gw.id)) {
            merged.push({ id: gw.id, enabled: true });
          }
        }
        setItems(merged);
      } else {
        setItems(DEFAULT_WIDGET_ORDER.map((w) => ({ ...w })));
      }
    }
  }, [open, prefData]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    setItems((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const toggleEnabled = (index: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, enabled: !item.enabled } : item,
      ),
    );
  };

  const handleSave = () => {
    updatePrefs.mutate(
      { widgetOrder: items },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Toggle widgets on or off and reorder them using the arrows.
        </p>

        <div className="mt-2 space-y-1 max-h-[400px] overflow-y-auto">
          {items.map((item, index) => {
            const def = GRID_WIDGETS.find((gw) => gw.id === item.id);
            if (!def) return null;
            const Icon = def.icon;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === items.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm">{def.label}</span>

                <Toggle
                  checked={item.enabled}
                  onChange={() => toggleEnabled(index)}
                  label={`Toggle ${def.label}`}
                />
              </div>
            );
          })}
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updatePrefs.isPending}
          >
            {updatePrefs.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
