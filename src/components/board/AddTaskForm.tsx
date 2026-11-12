import { useState, type FormEvent } from "react";
import { readTaskFields, TaskFields } from "@/components/board/TaskFields";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { GENERIC_ERROR_MESSAGE, readApiErrorMessage } from "@/lib/api-error";
import type { Task } from "@/lib/tasks";

type AddTaskFormProps = {
  projectId: string;
  onCreated: (task: Task) => void;
};

export function AddTaskForm({ projectId, onCreated }: AddTaskFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const { values, error: invalid } = readTaskFields(form);
    setError(invalid);
    if (invalid) {
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/v1/projects/${encodeURIComponent(projectId)}/tasks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        const body: { task: Task } = await response.json();
        form.reset();
        onCreated(body.task);
      } else {
        setError(await readApiErrorMessage(response));
      }
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  // noValidate: validation runs in readTaskFields so its message is announced through FormError.
  return (
    <form aria-label="Add task" noValidate onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3">
      <FormError message={error} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr_auto] md:items-end">
        <TaskFields />
        <div>
          <SubmitButton label="Add task" pending={pending} />
        </div>
      </div>
    </form>
  );
}
