import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  children: ReactNode;
};

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <main className="flex flex-1 items-start justify-center bg-zinc-100 px-4 py-16 text-zinc-900">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Team Task Board</p>
        <h1 className="mt-1 mb-6 text-2xl font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}
