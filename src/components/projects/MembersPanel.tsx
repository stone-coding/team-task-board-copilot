"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DANGER_BUTTON, GHOST_BUTTON, INPUT, SECONDARY_BUTTON } from "@/components/ui/button-styles";
import { FormError } from "@/components/ui/FormError";
import { GENERIC_ERROR_MESSAGE, readApiErrorMessage } from "@/lib/api-error";
import type { ProjectMemberInfo, ProjectRole } from "@/lib/projects";

type MembersPanelProps = {
  projectId: string;
  currentUserId: string;
  role: ProjectRole;
  members: ProjectMemberInfo[];
};

const ROLE_LABELS: Record<ProjectRole, string> = { OWNER: "Owner", MEMBER: "Member" };

export function MembersPanel({ projectId, currentUserId, role, members }: MembersPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const membersUrl = `/api/v1/projects/${encodeURIComponent(projectId)}/members`;

  async function send(request: () => Promise<Response>, onSuccess: () => void) {
    setPending(true);
    setError(null);
    try {
      const response = await request();
      if (response.ok) {
        onSuccess();
      } else {
        setError(await readApiErrorMessage(response));
      }
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "");
    return send(
      () => fetch(membersUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }),
      () => {
        form.reset();
        router.refresh();
      },
    );
  }

  function handleRemove(userId: string) {
    return send(() => fetch(`${membersUrl}/${encodeURIComponent(userId)}`, { method: "DELETE" }), () => router.refresh());
  }

  function handleLeave() {
    return send(
      () => fetch(`${membersUrl}/${encodeURIComponent(currentUserId)}`, { method: "DELETE" }),
      () => {
        router.replace("/projects");
        router.refresh();
      },
    );
  }

  return (
    <section aria-label="Project members" className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">Members</p>
        <p className="text-xs text-zinc-600">
          {members.length} {members.length === 1 ? "person" : "people"}
        </p>
      </div>
      <FormError message={error} />
      <ul className="flex flex-col divide-y divide-zinc-100">
        {members.map((member) => (
          <li key={member.userId} className="flex flex-wrap items-center gap-3 py-2">
            <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
              {member.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900">
                {member.name}
                {member.userId === currentUserId ? <span className="font-normal text-zinc-600"> (you)</span> : null}
              </p>
              <p className="truncate text-xs text-zinc-600">{member.email}</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
              {ROLE_LABELS[member.role]}
            </span>
            {role === "OWNER" && member.role !== "OWNER" ? (
              <button type="button" onClick={() => handleRemove(member.userId)} disabled={pending} aria-label={`Remove ${member.name}`} className={GHOST_BUTTON}>
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {role === "OWNER" ? (
        <form aria-label="Add member" onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label htmlFor="member-email" className="text-sm font-medium text-zinc-900">
              Member email
            </label>
            <input id="member-email" name="email" type="email" required autoComplete="off" placeholder="teammate@example.com" className={`${INPUT} placeholder:text-zinc-500`} />
          </div>
          <button type="submit" disabled={pending} className={SECONDARY_BUTTON}>
            Add member
          </button>
        </form>
      ) : confirmingLeave ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="w-full text-sm text-zinc-900">Leave this project? You will lose access to its board.</p>
          <button type="button" onClick={handleLeave} disabled={pending} className={DANGER_BUTTON}>
            Confirm leave
          </button>
          <button type="button" onClick={() => setConfirmingLeave(false)} disabled={pending} className={SECONDARY_BUTTON}>
            Cancel
          </button>
        </div>
      ) : (
        <div>
          <button type="button" onClick={() => setConfirmingLeave(true)} className={SECONDARY_BUTTON}>
            Leave project
          </button>
        </div>
      )}
    </section>
  );
}
