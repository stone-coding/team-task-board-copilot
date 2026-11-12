import { useEffect, useRef, useState } from "react";
import { DANGER_BUTTON, SECONDARY_BUTTON } from "@/components/ui/button-styles";
import { FormError } from "@/components/ui/FormError";
import { GENERIC_ERROR_MESSAGE, readApiErrorMessage } from "@/lib/api-error";
import type { Task } from "@/lib/tasks";

type TaskDeleteConfirmProps = {
  task: Task;
  onDeleted: (taskId: string) => void;
  onCancel: () => void;
};

export function TaskDeleteConfirm({ task, onDeleted, onCancel }: TaskDeleteConfirmProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // The safe choice gets focus first.
  useEffect(() => cancelRef.current?.focus(), []);

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/tasks/${encodeURIComponent(task.id)}`, { method: "DELETE" });
      if (response.ok) {
        onDeleted(task.id);
        return;
      }
      setError(await readApiErrorMessage(response));
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    }
    setPending(false);
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-zinc-900">Delete this task?</p>
        <button type="button" onClick={handleConfirm} disabled={pending} aria-label={`Confirm delete ${task.title}`} className={DANGER_BUTTON}>
          Confirm delete
        </button>
        <button ref={cancelRef} type="button" onClick={onCancel} disabled={pending} aria-label={`Cancel deleting ${task.title}`} className={SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>
      <FormError message={error} />
    </div>
  );
}
