import { useId, type ChangeEvent } from "react";
import { FOCUS_RING, INPUT, SECONDARY_BUTTON } from "@/components/ui/button-styles";
import { EMPTY_FILTERS, hasActiveFilters, isPriorityFilter, isStatusFilter, type TaskFilterValues } from "@/lib/task-filters";
import type { ProjectMemberInfo } from "@/lib/projects";
import { PRIORITIES_HIGH_FIRST, PRIORITY_LABELS } from "@/lib/task-priority";
import { STATUS_LABELS, TASK_STATUSES } from "@/lib/task-status";

type TaskFiltersProps = {
  filters: TaskFilterValues;
  onChange: (filters: TaskFilterValues) => void;
  /** Tasks that match the filters, and all tasks on the board. */
  shown: number;
  total: number;
  /** Project members; the assignee filter appears only when given. */
  members?: ProjectMemberInfo[];
};

const SELECT = `rounded-lg border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm ${FOCUS_RING}`;

export function TaskFilters({ filters, onChange, shown, total, members = [] }: TaskFiltersProps) {
  const searchId = useId();
  const statusId = useId();
  const priorityId = useId();
  const assigneeId = useId();
  const active = hasActiveFilters(filters);

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target;
    if (isStatusFilter(value)) {
      onChange({ ...filters, status: value });
    }
  }

  function handlePriorityChange(event: ChangeEvent<HTMLSelectElement>) {
    const { value } = event.target;
    if (isPriorityFilter(value)) {
      onChange({ ...filters, priority: value });
    }
  }

  return (
    <div role="search" aria-label="Filter tasks" className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <label htmlFor={searchId} className="text-sm font-medium text-zinc-900">
            Search tasks
          </label>
          <input
            id={searchId}
            type="search"
            value={filters.query}
            onChange={(event) => onChange({ ...filters, query: event.target.value })}
            placeholder="Title or description"
            autoComplete="off"
            className={`${INPUT} placeholder:text-zinc-500`}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:w-48">
          <label htmlFor={statusId} className="text-sm font-medium text-zinc-900">
            Filter by status
          </label>
          <select
            id={statusId}
            value={filters.status}
            onChange={handleStatusChange}
            className={`rounded-lg border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm ${FOCUS_RING}`}
          >
            <option value="ALL">All statuses</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-44">
          <label htmlFor={priorityId} className="text-sm font-medium text-zinc-900">
            Filter by priority
          </label>
          <select
            id={priorityId}
            value={filters.priority}
            onChange={handlePriorityChange}
            className={`rounded-lg border border-zinc-400 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm ${FOCUS_RING}`}
          >
            <option value="ALL">All priorities</option>
            {PRIORITIES_HIGH_FIRST.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </div>
        {members.length > 0 ? (
          <div className="flex flex-col gap-1.5 sm:w-44">
            <label htmlFor={assigneeId} className="text-sm font-medium text-zinc-900">
              Filter by assignee
            </label>
            <select id={assigneeId} value={filters.assignee} onChange={(event) => onChange({ ...filters, assignee: event.target.value })} className={SELECT}>
              <option value="ALL">All assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <button type="button" onClick={() => onChange(EMPTY_FILTERS)} disabled={!active} className={SECONDARY_BUTTON}>
          Clear filters
        </button>
      </div>
      <p role="status" className="text-xs text-zinc-600">
        {active ? `Showing ${shown} of ${total} ${total === 1 ? "task" : "tasks"}` : ""}
      </p>
    </div>
  );
}
