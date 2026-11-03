import { ProjectListItem } from "@/components/projects/ProjectListItem";
import type { Project } from "@/lib/projects";

type ProjectListProps = {
  projects: Project[];
};

export function ProjectList({ projects }: ProjectListProps) {
  return (
    <section aria-labelledby="your-projects-heading" className="flex flex-col gap-3">
      <h2 id="your-projects-heading" className="text-base font-semibold">
        Your projects
      </h2>
      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-400 py-5 text-center text-sm text-zinc-600">
          No projects yet
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <ProjectListItem key={project.id} project={project} />
          ))}
        </ul>
      )}
    </section>
  );
}
