"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FormError } from "@/components/ui/FormError";
import { readApiErrorMessage } from "@/lib/api-error";
import type { Project } from "@/lib/projects";

type ProjectListItemProps = {
  project: Project;
};

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const SECONDARY_BUTTON = `rounded-md border border-zinc-400 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 ${FOCUS_RING}`;

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
    const response = await fetch(`/api/v1/projects/${encodeURIComponent(project.id)}`, { method: "DELETE" });
    if (response.ok) {
      router.refresh();
      return;
    }
    setError(await readApiErrorMessage(response));
    setPending(false);
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold break-words">
          <Link href={`/projects/${project.id}`} className={`text-blue-700 underline ${FOCUS_RING}`}>
            {project.name}
          </Link>
        </h3>
        {confirming ? null : (
          <button ref={deleteRef} type="button" onClick={() => toggleConfirming(true)} aria-label={`Delete ${project.name}`} className={SECONDARY_BUTTON}>
            Delete
          </button>
        )}
      </div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-zinc-900">Delete this project and all its tasks?</p>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            aria-label={`Confirm delete ${project.name}`}
            className={`rounded-md bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60 ${FOCUS_RING}`}
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
