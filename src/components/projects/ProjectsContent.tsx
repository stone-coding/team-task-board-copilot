import { redirect } from "next/navigation";
import { ProjectList } from "@/components/projects/ProjectList";
import { getCurrentUserId } from "@/server/auth/current-user";
import { listProjects } from "@/server/services/projects";

export async function ProjectsContent() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login?next=%2Fprojects");
  }
  return <ProjectList projects={await listProjects(userId)} />;
}
