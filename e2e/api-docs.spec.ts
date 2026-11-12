import { expect, test } from "@playwright/test";

test("a signed-out visitor can read the API docs at /api/docs", async ({ page }) => {
  await page.goto("/api/docs");

  await expect(page.getByRole("heading", { name: /Team Task Board API/ })).toBeVisible();
  await expect(page.getByText("/projects/{projectId}/tasks", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("/tasks/{taskId}", { exact: true }).first()).toBeVisible();
});
