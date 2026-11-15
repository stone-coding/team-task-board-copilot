export function ProjectListSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3">
      <p role="status" className="sr-only">
        Loading projects…
      </p>
      <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 motion-reduce:animate-none" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl border border-zinc-200 bg-white motion-reduce:animate-none" />
        ))}
      </div>
    </div>
  );
}
