import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Board } from "@/components/board/Board";
import { mockProject, mockTasks } from "@/lib/mock-tasks";

export default function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  return (
    <Suspense fallback={<main className="p-4">Loading board...</main>}>
      <ProjectBoard params={params} />
    </Suspense>
  );
}

async function ProjectBoard({ params }: { params: PageProps<"/projects/[projectId]">["params"] }) {
  const { projectId } = await params;
  if (projectId !== mockProject.id) {
    notFound();
  }

  const projectTasks = mockTasks.filter((task) => task.projectId === projectId);

  return (
    <>
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-zinc-600">Projects / {mockProject.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{mockProject.name}</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4">
        <Board initialTasks={projectTasks} />
        <p className="mt-6 text-xs text-zinc-600">
          Move tasks between columns with each card&apos;s status menu.
        </p>
      </main>
    </>
  );
}