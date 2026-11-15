import { useId } from "react";
import { FOCUS_RING } from "@/components/ui/button-styles";
import { TextAreaField } from "@/components/ui/TextAreaField";
import { TextField } from "@/components/ui/TextField";
import type { ProjectMemberInfo } from "@/lib/projects";
import { DEFAULT_PRIORITY, PRIORITIES_HIGH_FIRST, PRIORITY_LABELS } from "@/lib/task-priority";
import { createTaskSchema, TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from "@/lib/task-schemas";
import type { TaskPriority } from "@/lib/tasks";

type TaskFieldsProps = {
  defaultTitle?: string;
  defaultDescription?: string;
  defaultPriority?: TaskPriority;
  defaultAssigneeId?: string;
  /** Project members; the Assignee select appears only when given. */
  members?: ProjectMemberInfo[];
};

const SELECT = `rounded-lg border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm ${FOCUS_RING}`;

export function TaskFields({ defaultTitle, defaultDescription, defaultPriority = DEFAULT_PRIORITY, defaultAssigneeId = "", members = [] }: TaskFieldsProps) {
  const priorityId = useId();
  const assigneeId = useId();
  return (
    <>
      <TextField label="Title" name="title" maxLength={TASK_TITLE_MAX_LENGTH} defaultValue={defaultTitle} autoComplete="off" required />
      <TextAreaField label="Description (optional)" name="description" maxLength={TASK_DESCRIPTION_MAX_LENGTH} defaultValue={defaultDescription} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={priorityId} className="text-sm font-medium text-zinc-900">
          Priority
        </label>
        <select id={priorityId} name="priority" defaultValue={defaultPriority} className={SELECT}>
          {PRIORITIES_HIGH_FIRST.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </option>
          ))}
        </select>
      </div>
      {members.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={assigneeId} className="text-sm font-medium text-zinc-900">
            Assignee
          </label>
          <select id={assigneeId} name="assigneeId" defaultValue={defaultAssigneeId} className={SELECT}>
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </>
  );
}

type TaskFieldValues = { title: string; description: string; priority: string; assigneeId?: string | null };

/** Reads the fields as typed (the API trims them) and returns the first validation message, if any. */
export function readTaskFields(form: HTMLFormElement) {
  const data = new FormData(form);
  const values: TaskFieldValues = {
    title: String(data.get("title") ?? ""),
    description: String(data.get("description") ?? ""),
    priority: String(data.get("priority") ?? DEFAULT_PRIORITY),
  };
  if (data.has("assigneeId")) {
    values.assigneeId = String(data.get("assigneeId")) || null;
  }
  const parsed = createTaskSchema.safeParse(values);
  return { values, error: parsed.success ? null : (parsed.error.issues[0]?.message ?? null) };
}
