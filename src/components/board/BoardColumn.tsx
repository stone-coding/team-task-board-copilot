import { useId } from "react";
import { TaskCard } from "@/components/board/TaskCard";
import { STATUS_LABELS } from "@/lib/task-status";
import type { ProjectMemberInfo } from "@/lib/projects";
import type { Task, TaskStatus } from "@/lib/tasks";

type BoardColumnProps = {
  status: TaskStatus;
  tasks: Task[];
  /** Shown when the column has no cards: "No tasks yet", or "No matching tasks" while filtering. */
  emptyMessage: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTaskSaved: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  members?: ProjectMemberInfo[];
  currentUserId?: string;
  canModerate?: boolean;
};

const ACCENT_CLASSES: Record<TaskStatus, { border: string; dot: string }> = {
  TODO: { border: "border-t-slate-500", dot: "bg-slate-500" },
  IN_PROGRESS: { border: "border-t-blue-600", dot: "bg-blue-600" },
  DONE: { border: "border-t-green-600", dot: "bg-green-600" },
};

export function BoardColumn({
  status,
  tasks,
  emptyMessage,
  onStatusChange,
  onTaskSaved,
  onTaskDeleted,
  members,
  currentUserId,
  canModerate,
}: BoardColumnProps) {
  const headingId = useId();
  const accent = ACCENT_CLASSES[status];

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col rounded-xl border border-t-4 border-zinc-200 bg-zinc-100/80 p-3 ${accent.border}`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className={`size-2 rounded-full ${accent.dot}`} />
          <h2 id={headingId} className="text-sm font-semibold text-zinc-900">
            {STATUS_LABELS[status]}
          </h2>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-600 tabular-nums ring-1 ring-zinc-200">
          {tasks.length}
          <span className="sr-only">{tasks.length === 1 ? " task" : " tasks"}</span>
        </span>
      </div>
      {tasks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              currentUserId={currentUserId}
              canModerate={canModerate}
              onStatusChange={onStatusChange}
              onSaved={onTaskSaved}
              onDeleted={onTaskDeleted}
            />
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-zinc-400 px-3 py-6 text-center">
          <p className="text-sm text-zinc-600">{emptyMessage}</p>
        </div>
      )}
    </section>
  );
}
