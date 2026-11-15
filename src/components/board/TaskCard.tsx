import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { TaskDeleteConfirm } from "@/components/board/TaskDeleteConfirm";
import { TaskEditForm } from "@/components/board/TaskEditForm";
import { SECONDARY_BUTTON } from "@/components/ui/button-styles";
import { STATUS_LABELS, TASK_STATUSES, isTaskStatus } from "@/lib/task-status";
import type { Task, TaskStatus } from "@/lib/tasks";

type TaskCardProps = {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onSaved: (task: Task) => void;
  onDeleted: (taskId: string) => void;
};

type Mode = "view" | "editing" | "confirmingDelete";

const CARD = "rounded-lg border border-zinc-200 bg-white px-3 py-2.5";

export function TaskCard({ task, onStatusChange, onSaved, onDeleted }: TaskCardProps) {
  const [mode, setMode] = useState<Mode>("view");
  const editRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<"edit" | "delete" | null>(null);

  // Back in view mode, put focus on the button that opened the edit form or the confirmation.
  useEffect(() => {
    if (mode === "view" && returnFocusTo.current) {
      (returnFocusTo.current === "edit" ? editRef : deleteRef).current?.focus();
      returnFocusTo.current = null;
    }
  }, [mode]);

  function backToView(button: "edit" | "delete") {
    returnFocusTo.current = button;
    setMode("view");
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target;
    if (isTaskStatus(value)) {
      onStatusChange(task.id, value);
    }
  }

  if (mode === "editing") {
    return (
      <li className={CARD}>
        <TaskEditForm
          task={task}
          onSaved={(saved) => {
            onSaved(saved);
            backToView("edit");
          }}
          onCancel={() => backToView("edit")}
        />
      </li>
    );
  }

  return (
    <li className={CARD}>
      <h3 className="text-sm font-semibold break-words">{task.title}</h3>
      {task.description ? <p className="mt-1 text-sm break-words text-zinc-600">{task.description}</p> : null}
      {mode === "confirmingDelete" ? (
        <TaskDeleteConfirm task={task} onDeleted={onDeleted} onCancel={() => backToView("delete")} />
      ) : (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-zinc-600">
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
          <div className="flex gap-2">
            <button ref={editRef} type="button" onClick={() => setMode("editing")} aria-label={`Edit ${task.title}`} className={SECONDARY_BUTTON}>
              Edit
            </button>
            <button ref={deleteRef} type="button" onClick={() => setMode("confirmingDelete")} aria-label={`Delete ${task.title}`} className={SECONDARY_BUTTON}>
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
