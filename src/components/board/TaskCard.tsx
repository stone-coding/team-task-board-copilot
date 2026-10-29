import type { ChangeEvent } from "react";
import { STATUS_LABELS, TASK_STATUSES, isTaskStatus } from "@/lib/task-status";
import type { Task, TaskStatus } from "@/lib/tasks";

type TaskCardProps = {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
};

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target;
    if (isTaskStatus(value)) {
      onStatusChange(task.id, value);
    }
  }

  return (
    <li className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <h3 className="text-sm font-semibold">{task.title}</h3>
      {task.description ? <p className="mt-1 text-sm text-zinc-600">{task.description}</p> : null}
      <label className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
        <span aria-hidden="true">Status</span>
        <select
          aria-label={`Status for ${task.title}`}
          className="rounded-md border border-zinc-400 bg-white px-2 py-1 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          value={task.status}
          onChange={handleStatusChange}
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
    </li>
  );
}
