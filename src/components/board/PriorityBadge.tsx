import { PRIORITY_LABELS } from "@/lib/task-priority";
import type { TaskPriority } from "@/lib/tasks";

type PriorityBadgeProps = {
  priority: TaskPriority;
};

const BADGE_CLASSES: Record<TaskPriority, string> = {
  HIGH: "bg-red-50 text-red-800 ring-red-200",
  MEDIUM: "bg-amber-50 text-amber-800 ring-amber-200",
  LOW: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

/** The text names the priority, so color is never the only signal. */
export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${BADGE_CLASSES[priority]}`}>
      {PRIORITY_LABELS[priority]} priority
    </span>
  );
}
