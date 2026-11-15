import { expect, type Page } from "@playwright/test";

type SeedTask = { title: string; description?: string; status: "TODO" | "IN_PROGRESS" | "DONE" };

// The same board as the mockups: three To Do, two In Progress, Done empty.
export const DEMO_TASKS: SeedTask[] = [
  { title: "Draft onboarding checklist", description: "List the first-week steps for new teammates.", status: "TODO" },
  { title: "Collect design feedback", status: "TODO" },
  { title: "Write release notes", description: "Summarize changes for the next release.", status: "TODO" },
  { title: "Set up project repository", status: "IN_PROGRESS" },
  { title: "Review sprint backlog", description: "Confirm priorities with the team.", status: "IN_PROGRESS" },
];

// Creates a project for the signed-in user through the API and returns its board path.
export async function createBoard(page: Page, name = "Demo Project", tasks: SeedTask[] = DEMO_TASKS) {
  const created = await page.request.post("/api/v1/projects", { data: { name } });
  expect(created.status()).toBe(201);
  const { project } = await created.json();

  for (const { status, ...task } of tasks) {
    const response = await page.request.post(`/api/v1/projects/${project.id}/tasks`, { data: task });
    expect(response.status()).toBe(201);
    if (status !== "TODO") {
      const { task: createdTask } = await response.json();
      const moved = await page.request.patch(`/api/v1/tasks/${createdTask.id}`, { data: { status } });
      expect(moved.status()).toBe(200);
    }
  }
  return `/projects/${project.id}`;
}
