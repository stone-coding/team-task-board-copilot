import { Suspense } from "react";
import { BoardSkeleton } from "@/components/board/BoardSkeleton";
import { ProjectBoard } from "@/components/board/ProjectBoard";
import { AppHeader } from "@/components/layout/AppHeader";

export default function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  return (
    <>
      <AppHeader />
      <div className="flex-1 text-zinc-900">
        <Suspense fallback={<BoardSkeleton />}>
          <ProjectBoard params={params} />
        </Suspense>
      </div>
    </>
  );
}
