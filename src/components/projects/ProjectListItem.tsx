"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DANGER_BUTTON, FOCUS_RING, GHOST_BUTTON, SECONDARY_BUTTON } from "@/components/ui/button-styles";
import { FormError } from "@/components/ui/FormError";
import { GENERIC_ERROR_MESSAGE, readApiErrorMessage } from "@/lib/api-error";
import type { Project } from "@/lib/projects";

type ProjectListItemProps = {
  project: Project;
};


export function ProjectListItem({ project }: ProjectListItemProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const userToggled = useRef(false);

  // Keep keyboard focus on the step the user is in: Cancel when asked to confirm, Delete after cancelling.
  useEffect(() => {
    if (userToggled.current) {
      (confirming ? cancelRef : deleteRef).current?.focus();
    }
  }, [confirming]);

  function toggleConfirming(next: boolean) {
    userToggled.current = true;
    setError(null);
    setConfirming(next);
  }

  async function handleConfirm() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/projects/${encodeURIComponent(project.id)}`, { method: "DELETE" });
      if (response.ok) {
        router.refresh();
        return;
      }
      setError(await readApiErrorMessage(response));
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    }
    // Only failures re-enable the buttons; on success they stay disabled until the refresh removes the item.
    setPending(false);
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700"
          >
            {project.name.trim().charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold break-words text-zinc-900">
              <Link href={`/projects/${project.id}`} className={`rounded hover:underline ${FOCUS_RING}`}>
                {project.name}
              </Link>
            </h3>
            <p className="text-xs text-zinc-600">Open the board</p>
          </div>
        </div>
        {confirming ? null : (
          <button ref={deleteRef} type="button" onClick={() => toggleConfirming(true)} aria-label={`Delete ${project.name}`} className={GHOST_BUTTON}>
            Delete
          </button>
        )}
      </div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="w-full text-sm text-zinc-900">Delete this project and all its tasks?</p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            aria-label={`Confirm delete ${project.name}`}
            className={DANGER_BUTTON}
          >
            Confirm delete
          </button>
          <button ref={cancelRef} type="button" onClick={() => toggleConfirming(false)} disabled={pending} aria-label={`Cancel deleting ${project.name}`} className={SECONDARY_BUTTON}>
            Cancel
          </button>
        </div>
      ) : null}
      <FormError message={error} />
    </li>
  );
}
