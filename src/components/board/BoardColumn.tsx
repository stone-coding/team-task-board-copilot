import { TaskCard } from "@/components/board/TaskCard";
import { STATUS_LABELS } from "@/lib/task-status";
import type { Task, TaskStatus } from "@/lib/tasks";

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
      className={`rounded-xl border border-t-4 border-zinc-200 bg-zinc-50 p-3 ${ACCENT_CLASSES[status]}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 id={headingId} className="text-base font-semibold">
          {STATUS_LABELS[status]}
        </h2>
        <span className="rounded-full bg-zinc-200 px-2 text-xs font-semibold text-zinc-600">
          {tasks.length}
        </span>
      </div>
      {tasks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={onStatusChange} />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-400 py-5 text-center text-sm text-zinc-600">
          No tasks yet
        </div>
      )}
    </section>
  );
}
