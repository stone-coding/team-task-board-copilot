import { useId, type TextareaHTMLAttributes } from "react";

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
};

export function TextAreaField({ label, ...textAreaProps }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-900">
        {label}
      </label>
      <textarea
        id={id}
        rows={2}
        className="rounded-md border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        {...textAreaProps}
      />
    </div>
  );
}
