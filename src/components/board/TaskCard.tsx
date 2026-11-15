import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { TaskDeleteConfirm } from "@/components/board/TaskDeleteConfirm";
import { TaskEditForm } from "@/components/board/TaskEditForm";
import { FOCUS_RING, GHOST_BUTTON } from "@/components/ui/button-styles";
import { STATUS_LABELS, TASK_STATUSES, isTaskStatus } from "@/lib/task-status";
import type { Task, TaskStatus } from "@/lib/tasks";

type TaskCardProps = {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onSaved: (task: Task) => void;
  onDeleted: (taskId: string) => void;
};

type Mode = "view" | "editing" | "confirmingDelete";

const CARD = "rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md";

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
      <h3 className="text-sm font-medium break-words text-zinc-900">{task.title}</h3>
      {task.description ? <p className="mt-1 text-sm leading-relaxed break-words text-zinc-600">{task.description}</p> : null}
      {mode === "confirmingDelete" ? (
        <TaskDeleteConfirm task={task} onDeleted={onDeleted} onCancel={() => backToView("delete")} />
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-2.5">
          <label className="flex items-center gap-2 text-xs text-zinc-600">
            <span aria-hidden="true">Status</span>
            <select
              aria-label={`Status for ${task.title}`}
              className={`rounded-md border border-zinc-400 bg-white px-2 py-1 text-xs font-medium text-zinc-900 ${FOCUS_RING}`}
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
          <div className="flex gap-1">
            <button ref={editRef} type="button" onClick={() => setMode("editing")} aria-label={`Edit ${task.title}`} className={GHOST_BUTTON}>
              Edit
            </button>
            <button ref={deleteRef} type="button" onClick={() => setMode("confirmingDelete")} aria-label={`Delete ${task.title}`} className={`${GHOST_BUTTON} hover:bg-red-50 hover:text-red-800`}>
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
