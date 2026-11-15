import { useId, type TextareaHTMLAttributes } from "react";
import { INPUT } from "@/components/ui/button-styles";

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
};

export function TextAreaField({ label, ...textAreaProps }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-900">
        {label}
      </label>
      <textarea id={id} rows={2} className={`${INPUT} resize-y`} {...textAreaProps} />
    </div>
  );
}
