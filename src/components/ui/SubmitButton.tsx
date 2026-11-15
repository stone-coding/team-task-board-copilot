import { PRIMARY_BUTTON } from "@/components/ui/button-styles";

type SubmitButtonProps = {
  label: string;
  pending: boolean;
};

export function SubmitButton({ label, pending }: SubmitButtonProps) {
  return (
    <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
      {pending ? (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
        />
      ) : null}
      {label}
    </button>
  );
}
