import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { CreateProjectForm } from "@/components/projects/CreateProjectForm";
import { ProjectListSkeleton } from "@/components/projects/ProjectListSkeleton";
import { ProjectsContent } from "@/components/projects/ProjectsContent";

export const metadata: Metadata = { title: "Projects · Team Task Board" };

export default function ProjectsPage() {
  return (
    <>
      <AppHeader current="projects" />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 text-zinc-900">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-zinc-600">Create a project for each body of work, then track its tasks on a board.</p>
        </div>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
          <CreateProjectForm />
          <Suspense fallback={<ProjectListSkeleton />}>
            <ProjectsContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
