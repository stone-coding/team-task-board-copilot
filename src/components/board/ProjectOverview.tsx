import type { ProjectStats } from "@/lib/project-stats";

type ProjectOverviewProps = {
  stats: ProjectStats;
};

type StatProps = {
  label: string;
  value: string;
};

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-medium text-zinc-600">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900">{value}</dd>
    </div>
  );
}

export function ProjectOverview({ stats }: ProjectOverviewProps) {
  const { total, inProgress, completed, completionRate } = stats;
  const summary =
    total === 0 ? "Add a task to start tracking progress" : `${completed} of ${total} ${total === 1 ? "task" : "tasks"} completed`;

  return (
    <div role="group" aria-label="Project overview" className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total tasks" value={String(total)} />
        <Stat label="In progress" value={String(inProgress)} />
        <Stat label="Completed" value={String(completed)} />
        <Stat label="Completion rate" value={`${completionRate}%`} />
      </dl>
      <div className="flex items-center gap-3">
        <progress
          aria-label="Completion rate"
          value={completed}
          max={Math.max(total, 1)}
          className="h-2 flex-1 appearance-none overflow-hidden rounded-full bg-zinc-200 [&::-moz-progress-bar]:bg-green-600 [&::-webkit-progress-bar]:bg-zinc-200 [&::-webkit-progress-value]:bg-green-600"
        />
        <p className="shrink-0 text-xs text-zinc-600">{summary}</p>
      </div>
    </div>
  );
}
