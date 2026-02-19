import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthRange, getSunday } from "../utils";

interface WeekNavigatorProps {
  monday: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekNavigator({ monday, onPrev, onNext, onToday }: WeekNavigatorProps) {
  const sunday = getSunday(monday);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={onToday}>
        Today
      </Button>
      <Button variant="outline" size="sm" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium ml-2">
        {formatMonthRange(monday, sunday)}
      </span>
    </div>
  );
}
