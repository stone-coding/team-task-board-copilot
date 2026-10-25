import type { Task, TaskStatus } from "@/lib/tasks";
import { STATUS_LABELS } from "@/lib/task-status";
import { TaskCard } from "./TaskCard";

type BoardColumnProps = {
  status: TaskStatus;
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
};

const ACCENT_CLASSES: Record<TaskStatus, string> = {
  TODO: "border-t-slate-500",
  IN_PROGRESS: "border-t-blue-600",
  DONE: "border-t-green-600",
};

export function BoardColumn({ status, tasks, onStatusChange }: BoardColumnProps) {
  const headingId = `column-${status.toLowerCase()}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`rounded-lg border border-zinc-200 border-t-4 bg-zinc-50 p-3 ${ACCENT_CLASSES[status]}`}
    >
      <h2 id={headingId} className="mb-3 flex items-center justify-between font-semibold">
        {STATUS_LABELS[status]}
        <span
          aria-hidden="true"
          className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-600"
        >
          {tasks.length}
        </span>
      </h2>
      {tasks.length > 0 ? (
        <ul className="grid gap-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-400 px-3 py-5 text-center text-sm text-zinc-600">
          No tasks yet
        </div>
      )}
    </section>
  );
}