import type { ReactNode } from "react";
import { BrandMark } from "@/components/layout/BrandMark";

type AuthCardProps = {
  title: string;
  children: ReactNode;
};

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-12 text-zinc-900 sm:py-20">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-sm font-semibold">
          <BrandMark />
          <p>Team Task Board</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-xl font-semibold tracking-tight">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}
