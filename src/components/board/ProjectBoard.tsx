import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Board } from "@/components/board/Board";
import { getCurrentUserId } from "@/server/auth/current-user";
import { findProject } from "@/server/services/projects";
import { listTasks } from "@/server/services/tasks";

type ProjectBoardProps = {
  params: Promise<{ projectId: string }>;
};

export async function ProjectBoard({ params }: ProjectBoardProps) {
  const { projectId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect(`/login?next=${encodeURIComponent(`/projects/${projectId}`)}`);
  }

  // Same owner-scoped services as the API: another user's project is not found.
  const [project, tasks] = await Promise.all([findProject(userId, projectId), listTasks(userId, projectId)]);
  if (!project || !tasks) {
    notFound();
  }

  return (
    <>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <p className="text-sm text-zinc-600">
            <Link href="/projects" className="underline hover:text-zinc-900">
              Projects
            </Link>{" "}
            / {project.name}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">{project.name}</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl p-4">
        <Board key={project.id} initialTasks={tasks} />
      </main>
    </>
  );
}
