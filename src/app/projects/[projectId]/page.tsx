import { notFound } from "next/navigation";
import Board from "./board";
import { mockProject, mockTasks } from "@/lib/mock-tasks";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export function generateStaticParams() {
  return [{ projectId: mockProject.id }];
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  if (projectId !== mockProject.id) {
    notFound();
  }

  return <Board project={mockProject} initialTasks={mockTasks} />;
}