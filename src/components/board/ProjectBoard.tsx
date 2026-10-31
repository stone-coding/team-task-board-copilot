import { notFound } from "next/navigation";
import { Board } from "@/components/board/Board";
import { mockProject, mockTasks } from "@/lib/mock-tasks";

type ProjectBoardProps = {
  params: Promise<{ projectId: string }>;
};

export async function ProjectBoard({ params }: ProjectBoardProps) {
  const { projectId } = await params;
  // TODO(#8): replace mock data with the tasks API.
  if (projectId !== mockProject.id) {
    notFound();
  }
  const projectTasks = mockTasks.filter((task) => task.projectId === projectId);

  return (
    <>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <p className="text-sm text-zinc-600">Projects / {mockProject.name}</p>
          <h1 className="mt-1 text-2xl font-semibold">{mockProject.name}</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl p-4">
        <Board initialTasks={projectTasks} />
      </main>
    </>
  );
}
