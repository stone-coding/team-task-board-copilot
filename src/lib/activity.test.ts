import { describe, expect, it } from "vitest";
import { describeActivity, type ActivityItem } from "@/lib/activity";

const base = { id: "a1", createdAt: "2026-11-15T18:00:00.000Z", actor: { userId: "u2", name: "Mason" } };

function item(fields: Partial<ActivityItem> & Pick<ActivityItem, "type">): ActivityItem {
  return { ...base, ...fields };
}

describe("describeActivity", () => {
  it.each([
    [item({ type: "TASK_CREATED", taskTitle: "Write copy" }), 'created "Write copy"'],
    [item({ type: "TASK_UPDATED", taskTitle: "Write copy" }), 'edited "Write copy"'],
    [item({ type: "TASK_MOVED", taskTitle: "Write copy", fromStatus: "TODO", toStatus: "DONE" }), 'moved "Write copy" from To Do to Done'],
    [item({ type: "TASK_ASSIGNED", taskTitle: "Write copy", subjectName: "Olivia" }), 'assigned "Write copy" to Olivia'],
    [item({ type: "TASK_ASSIGNED", taskTitle: "Write copy" }), 'unassigned "Write copy"'],
    [item({ type: "TASK_DELETED", taskTitle: "Write copy" }), 'deleted "Write copy"'],
    [item({ type: "COMMENT_ADDED", taskTitle: "Write copy" }), 'commented on "Write copy"'],
    [item({ type: "COMMENT_DELETED", taskTitle: "Write copy" }), 'deleted a comment on "Write copy"'],
    [item({ type: "MEMBER_ADDED", subjectName: "Nora" }), "added Nora to the project"],
    [item({ type: "MEMBER_REMOVED", subjectName: "Nora" }), "removed Nora from the project"],
    [item({ type: "MEMBER_LEFT" }), "left the project"],
  ])("describes %o", (activity, text) => {
    expect(describeActivity(activity)).toBe(text);
  });
});
