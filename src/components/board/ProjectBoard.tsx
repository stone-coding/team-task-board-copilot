import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Board } from "@/components/board/Board";
import { FOCUS_RING } from "@/components/ui/button-styles";
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
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-1">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm text-zinc-600">
          <Link href="/projects" className={`rounded hover:text-zinc-900 hover:underline ${FOCUS_RING}`}>
            Projects
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="truncate text-zinc-900">
            {project.name}
          </span>
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight break-words">{project.name}</h1>
      </div>
      <Board key={project.id} projectId={project.id} initialTasks={tasks} />
    </main>
  );
}
