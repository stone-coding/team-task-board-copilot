import { ProjectListItem } from "@/components/projects/ProjectListItem";
import type { Project } from "@/lib/projects";

type ProjectListProps = {
  projects: Project[];
};

export function ProjectList({ projects }: ProjectListProps) {
  return (
    <section aria-labelledby="your-projects-heading" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="your-projects-heading" className="text-sm font-semibold text-zinc-900">
          Your projects
        </h2>
        {projects.length > 0 ? (
          <p className="text-xs text-zinc-600">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        ) : null}
      </div>
      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-400 bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-zinc-900">No projects yet</p>
          <p className="mt-1 text-sm text-zinc-600">Name your first project to get started.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectListItem key={project.id} project={project} />
          ))}
        </ul>
      )}
    </section>
  );
}
