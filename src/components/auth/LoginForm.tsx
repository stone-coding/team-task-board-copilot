"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormError } from "@/components/ui/FormError";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { TextField } from "@/components/ui/TextField";
import { readApiErrorMessage } from "@/lib/api-error";

type LoginFormProps = {
  nextPath: string;
  registered: boolean;
};

export function LoginForm({ nextPath, registered }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (response.ok) {
      router.replace(nextPath);
      router.refresh();
      return;
    }
    setError(await readApiErrorMessage(response));
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {registered ? (
        <p role="status" className="rounded-md border border-green-700 bg-green-50 px-3 py-2 text-sm text-green-800">
          Account created. Log in to continue.
        </p>
      ) : null}
      <FormError message={error} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton label="Log in" pending={pending} />
      <p className="text-sm text-zinc-600">
        No account?{" "}
        <Link href="/register" className="font-medium text-blue-700 underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          Create one
        </Link>
      </p>
    </form>
  );
}
