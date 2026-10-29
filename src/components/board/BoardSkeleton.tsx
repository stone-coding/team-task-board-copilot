import { TASK_STATUSES } from "@/lib/task-status";

export function BoardSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl p-4" aria-busy="true">
      <p role="status" className="sr-only">
        Loading board…
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <div key={status} className="h-40 rounded-xl border border-zinc-200 bg-zinc-50" />
        ))}
      </div>
    </main>
  );
}
