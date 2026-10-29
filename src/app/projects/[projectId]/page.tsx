import { Suspense } from "react";
import { BoardSkeleton } from "@/components/board/BoardSkeleton";
import { ProjectBoard } from "@/components/board/ProjectBoard";

export default function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  return (
    <div className="flex-1 bg-zinc-100 text-zinc-900">
      <Suspense fallback={<BoardSkeleton />}>
        <ProjectBoard params={params} />
      </Suspense>
    </div>
  );
}
