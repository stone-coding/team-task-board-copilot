import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActivityFeed } from "@/components/board/ActivityFeed";
import type { ActivityItem } from "@/lib/activity";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

const ITEMS: ActivityItem[] = [
  {
    id: "a2",
    type: "TASK_MOVED",
    createdAt: "2026-11-15T18:05:00.000Z",
    actor: { userId: "u2", name: "Mason" },
    taskTitle: "Write copy",
    fromStatus: "TODO",
    toStatus: "DONE",
  },
  { id: "a1", type: "MEMBER_ADDED", createdAt: "2026-11-15T18:00:00.000Z", actor: { userId: "u1", name: "Olivia" }, subjectName: "Mason" },
];

function feed() {
  return screen.getByRole("region", { name: "Project activity" });
}

describe("ActivityFeed", () => {
  it("lists events newest first as sentences with the actor and a timestamp", () => {
    render(<ActivityFeed items={ITEMS} />);

    const rows = within(feed()).getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Mason moved "Write copy" from To Do to Done');
    expect(rows[1]).toHaveTextContent("Olivia added Mason to the project");
    expect(rows[0].querySelector("time")).toHaveAttribute("dateTime", "2026-11-15T18:05:00.000Z");
  });

  it("shows an empty state", () => {
    render(<ActivityFeed items={[]} />);

    expect(within(feed()).getByText("No activity yet")).toBeInTheDocument();
  });

  it("refreshes the page to load new activity", async () => {
    render(<ActivityFeed items={ITEMS} />);

    await userEvent.setup().click(within(feed()).getByRole("button", { name: "Refresh activity" }));

    expect(refresh).toHaveBeenCalled();
  });
});
