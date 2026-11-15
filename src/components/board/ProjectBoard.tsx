import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Board } from "@/components/board/Board";
import { FOCUS_RING } from "@/components/ui/button-styles";
import { getCurrentUserId } from "@/server/auth/current-user";
import { MembersPanel } from "@/components/projects/MembersPanel";
import { listMembers } from "@/server/services/members";
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

  // Same membership-scoped services as the API: a project the user does not belong to is not found.
  const [project, tasks, members] = await Promise.all([
    findProject(userId, projectId),
    listTasks(userId, projectId),
    listMembers(userId, projectId),
  ]);
  if (!project || !tasks || !members) {
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
      <MembersPanel projectId={project.id} currentUserId={userId} role={project.role} members={members} />
      {/* Keyed on membership too: after a member is removed, the refreshed (unassigned) tasks replace the old state. */}
      <Board
        key={`${project.id}:${members.map((member) => member.userId).join(",")}`}
        projectId={project.id}
        initialTasks={tasks}
        members={members}
        currentUserId={userId}
        canModerate={project.role === "OWNER"}
      />
    </main>
  );
}
