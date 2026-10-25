import type { Task } from "./tasks";

// Local mock data used until the tasks API exists (Sprint 2).
// Deliberately leaves DONE empty so the empty state is visible.
export const mockProject = { id: "demo", name: "Demo Project" } as const;

export const mockTasks: Task[] = [
  {
    id: "t1",
    projectId: "demo",
    title: "Draft onboarding checklist",
    description: "List the first-week steps for new teammates.",
    status: "TODO",
  },
  {
    id: "t2",
    projectId: "demo",
    title: "Collect design feedback",
    status: "TODO",
  },
  {
    id: "t3",
    projectId: "demo",
    title: "Write release notes",
    description: "Summarize changes for the next release.",
    status: "TODO",
  },
  {
    id: "t4",
    projectId: "demo",
    title: "Set up project repository",
    status: "IN_PROGRESS",
  },
  {
    id: "t5",
    projectId: "demo",
    title: "Review sprint backlog",
    description: "Confirm priorities with the team.",
    status: "IN_PROGRESS",
  },
];
