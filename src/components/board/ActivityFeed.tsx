"use client";

import { useRouter } from "next/navigation";
import { GHOST_BUTTON } from "@/components/ui/button-styles";
import { describeActivity, type ActivityItem } from "@/lib/activity";

type ActivityFeedProps = {
  items: ActivityItem[];
};

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function ActivityFeed({ items }: ActivityFeedProps) {
  const router = useRouter();
  return (
    <section aria-label="Project activity" className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-900">Activity</p>
        <button type="button" onClick={() => router.refresh()} aria-label="Refresh activity" className={GHOST_BUTTON}>
          Refresh
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-600">No activity yet</p>
      ) : (
        <ol className="flex flex-col">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-0.5 border-l-2 border-zinc-200 py-1.5 pl-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
              <p className="min-w-0 text-sm break-words text-zinc-900">
                <span className="font-medium">{item.actor.name}</span> {describeActivity(item)}
              </p>
              {/* Rendered in the viewer's time zone; the server's render may differ, so React keeps the browser's text. */}
              <time dateTime={item.createdAt} suppressHydrationWarning className="shrink-0 text-xs text-zinc-600">
                {TIME_FORMAT.format(new Date(item.createdAt))}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
