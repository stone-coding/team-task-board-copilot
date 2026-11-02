"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { TextField } from "@/components/ui/TextField";
import { readApiErrorMessage } from "@/lib/api-error";
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
    setPending(false);
  }

  return (
    <form aria-label="New project" onSubmit={handleSubmit} className="flex flex-col gap-3">
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
