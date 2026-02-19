import { useState } from "react";
import {
  useRecurringConfigs,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
} from "../api";
import { useTemplates } from "@/features/templates/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
};

const frequencyBadgeStyles: Record<string, string> = {
  DAILY: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  WEEKLY: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  BIWEEKLY: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  MONTHLY: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

interface RecurringManagerProps {
  projectId: string;
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RecurringManager({ projectId }: RecurringManagerProps) {
  const { data: configsData } = useRecurringConfigs(projectId);
  const { data: templatesData } = useTemplates(projectId);
  const createRecurring = useCreateRecurring(projectId);
  const updateRecurring = useUpdateRecurring(projectId);
  const deleteRecurring = useDeleteRecurring(projectId);

  const configs = configsData?.data ?? [];
  const templates = templatesData?.data ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [frequency, setFrequency] = useState<string>("WEEKLY");
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const resetForm = () => {
    setTemplateId("");
    setFrequency("WEEKLY");
    setDayOfWeek(1);
    setDayOfMonth(1);
    setStartDate(todayStr());
    setEndDate("");
  };

  const handleCreate = () => {
    if (!templateId || !startDate) return;
    createRecurring.mutate(
      {
        templateId,
        frequency: frequency as "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY",
        ...(frequency === "WEEKLY" || frequency === "BIWEEKLY"
          ? { dayOfWeek }
          : {}),
        ...(frequency === "MONTHLY" ? { dayOfMonth } : {}),
        startDate,
        ...(endDate ? { endDate } : {}),
      },
      {
        onSuccess: () => {
          resetForm();
          setShowCreate(false);
        },
      },
    );
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    updateRecurring.mutate({ id, isActive: !isActive });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Recurring Tasks</h3>

      <div className="space-y-2">
        {configs.map((c) => (
          <div
            key={c.id}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3 py-2",
              !c.isActive && "opacity-50",
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {c.template.name}
              </div>
              <div className="text-xs text-muted-foreground">
                Next: {c.nextRunDate}
                {c.endDate && ` (ends ${c.endDate})`}
              </div>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                frequencyBadgeStyles[c.frequency],
              )}
            >
              {FREQUENCY_LABELS[c.frequency]}
            </span>
            <button
              onClick={() => handleToggleActive(c.id, c.isActive)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
                c.isActive ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                  c.isActive ? "translate-x-4" : "translate-x-0",
                )}
              />
            </button>
            <button
              onClick={() => setDeleteTarget(c.id)}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {configs.length === 0 && !showCreate && (
          <p className="text-sm text-muted-foreground py-2">
            No recurring tasks configured
          </p>
        )}
      </div>

      {showCreate ? (
        <div className="rounded-md border px-3 py-3 space-y-3">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create a template first to set up recurring tasks.
            </p>
          ) : (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Template</Label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Frequency</Label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Every 2 weeks</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              {(frequency === "WEEKLY" || frequency === "BIWEEKLY") && (
                <div className="space-y-1">
                  <Label className="text-xs">Day of week</Label>
                  <div className="flex gap-1">
                    {DAYS_OF_WEEK.map((name, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setDayOfWeek(i)}
                        className={cn(
                          "rounded px-2 py-1 text-xs font-medium transition-all",
                          dayOfWeek === i
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80",
                        )}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frequency === "MONTHLY" && (
                <div className="space-y-1">
                  <Label className="text-xs">Day of month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10) || 1)}
                    className="h-8 text-sm w-20"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Start date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End date (optional)</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            {templates.length > 0 && (
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!templateId || !startDate || createRecurring.isPending}
              >
                {createRecurring.isPending ? "Creating..." : "Create"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New recurring config
        </Button>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteRecurring.mutate(deleteTarget, {
              onSuccess: () => setDeleteTarget(null),
            });
          }
        }}
        title="Delete recurring config"
        description="This will stop future task creation from this config."
        confirmLabel="Delete"
        loading={deleteRecurring.isPending}
      />
    </div>
  );
}
