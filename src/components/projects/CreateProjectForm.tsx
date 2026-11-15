"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { TextField } from "@/components/ui/TextField";
import { GENERIC_ERROR_MESSAGE, readApiErrorMessage } from "@/lib/api-error";
import { PROJECT_NAME_MAX_LENGTH } from "@/lib/project-schemas";

export function CreateProjectForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: new FormData(form).get("name") }),
      });
      if (response.ok) {
        form.reset();
        router.refresh();
      } else {
        setError(await readApiErrorMessage(response));
      }
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      aria-label="New project"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-20"
    >
      <div>
        <p className="text-sm font-semibold text-zinc-900">New project</p>
        <p className="mt-0.5 text-xs text-zinc-600">Only you can see the projects you create.</p>
      </div>
      <FormError message={error} />
      <TextField
        label="Project name"
        name="name"
        maxLength={PROJECT_NAME_MAX_LENGTH}
        hint={`Up to ${PROJECT_NAME_MAX_LENGTH} characters.`}
        autoComplete="off"
        required
      />
      <div>
        <SubmitButton label="Create project" pending={pending} />
      </div>
    </form>
  );
}
