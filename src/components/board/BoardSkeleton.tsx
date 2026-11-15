import { TASK_STATUSES } from "@/lib/task-status";

const PULSE = "animate-pulse motion-reduce:animate-none";

export function BoardSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6" aria-busy="true">
      <p role="status" className="sr-only">
        Loading board…
      </p>
      <div className="flex flex-col gap-2">
        <div className={`h-4 w-40 rounded bg-zinc-200 ${PULSE}`} />
        <div className={`h-7 w-64 rounded bg-zinc-200 ${PULSE}`} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={`h-[74px] rounded-xl border border-zinc-200 bg-white ${PULSE}`} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {TASK_STATUSES.map((status) => (
          <div key={status} className={`h-64 rounded-xl border border-zinc-200 bg-zinc-100 ${PULSE}`} />
        ))}
      </div>
    </main>
  );
}
