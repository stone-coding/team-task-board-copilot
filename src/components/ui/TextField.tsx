import { useId, type InputHTMLAttributes } from "react";
import { INPUT } from "@/components/ui/button-styles";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
};

export function TextField({ label, hint, ...inputProps }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-900">
        {label}
      </label>
      <input id={id} aria-describedby={hint ? hintId : undefined} className={INPUT} {...inputProps} />
      {hint ? (
        <p id={hintId} className="text-xs text-zinc-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
