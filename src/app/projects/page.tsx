import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { ProjectsContent } from "@/components/projects/ProjectsContent";

export const metadata: Metadata = { title: "Projects · Team Task Board" };

export default function ProjectsPage() {
  return (
    <div className="flex-1 bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-4">
          <h1 className="text-2xl font-semibold">Projects</h1>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
        <CreateProjectForm />
        <Suspense fallback={<p className="text-sm text-zinc-600">Loading projects…</p>}>
          <ProjectsContent />
        </Suspense>
      </main>
    </div>
  );
}
