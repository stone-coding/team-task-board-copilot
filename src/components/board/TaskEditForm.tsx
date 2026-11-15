import { useEffect, useRef, useState, type FormEvent } from "react";
import { readTaskFields, TaskFields } from "@/components/board/TaskFields";
import { SECONDARY_BUTTON } from "@/components/ui/button-styles";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { GENERIC_ERROR_MESSAGE, readApiErrorMessage } from "@/lib/api-error";
import type { Task } from "@/lib/tasks";

type TaskEditFormProps = {
  task: Task;
  onSaved: (task: Task) => void;
  onCancel: () => void;
};

export function TaskEditForm({ task, onSaved, onCancel }: TaskEditFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const title = formRef.current?.elements.namedItem("title");
    if (title instanceof HTMLInputElement) {
      title.focus();
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { values, error: invalid } = readTaskFields(event.currentTarget);
    setError(invalid);
    if (invalid) {
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/v1/tasks/${encodeURIComponent(task.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        const body: { task: Task } = await response.json();
        onSaved(body.task);
        return;
      }
      setError(await readApiErrorMessage(response));
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    }
    setPending(false);
  }

  return (
    <form ref={formRef} aria-label={`Edit ${task.title}`} noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
      <FormError message={error} />
      <TaskFields defaultTitle={task.title} defaultDescription={task.description} />
      <div className="flex gap-2">
        <SubmitButton label="Save" pending={pending} />
        <button type="button" onClick={onCancel} disabled={pending} className={SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>
    </form>
  );
}
