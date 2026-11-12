import { TextAreaField } from "@/components/ui/TextAreaField";
import { TextField } from "@/components/ui/TextField";
import { createTaskSchema, TASK_DESCRIPTION_MAX_LENGTH, TASK_TITLE_MAX_LENGTH } from "@/lib/task-schemas";

type TaskFieldsProps = {
  defaultTitle?: string;
  defaultDescription?: string;
};

export function TaskFields({ defaultTitle, defaultDescription }: TaskFieldsProps) {
  return (
    <>
      <TextField label="Title" name="title" maxLength={TASK_TITLE_MAX_LENGTH} defaultValue={defaultTitle} autoComplete="off" required />
      <TextAreaField label="Description (optional)" name="description" maxLength={TASK_DESCRIPTION_MAX_LENGTH} defaultValue={defaultDescription} />
    </>
  );
}

/** Reads the fields as typed (the API trims them) and returns the first validation message, if any. */
export function readTaskFields(form: HTMLFormElement) {
  const data = new FormData(form);
  const values = { title: String(data.get("title") ?? ""), description: String(data.get("description") ?? "") };
  const parsed = createTaskSchema.safeParse(values);
  return { values, error: parsed.success ? null : (parsed.error.issues[0]?.message ?? null) };
}
