import { expect, test, type Browser, type Page } from "@playwright/test";
import { E2E_PASSWORD } from "./helpers/auth";
import { createBoard } from "./helpers/board";

async function newUser(browser: Browser, name: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `e2e-${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  expect((await page.request.post("/api/v1/auth/register", { data: { email, name, password: E2E_PASSWORD } })).status()).toBe(201);
  expect((await page.request.post("/api/v1/auth/login", { data: { email, password: E2E_PASSWORD } })).status()).toBe(200);
  return { context, page, email };
}

function thread(page: Page) {
  return page.getByRole("region", { name: "Comments on Write release notes" });
}

async function openThread(page: Page) {
  await page.getByRole("button", { name: "Comments for Write release notes" }).click();
  await expect(thread(page)).toBeVisible();
}

test("members discuss a task; the owner can moderate; a nonmember cannot read comments", async ({ browser }) => {
  const owner = await newUser(browser, "Olivia");
  const member = await newUser(browser, "Mason");
  const outsider = await newUser(browser, "Nora");
  const boardPath = await createBoard(owner.page, "Discussions");
  await owner.page.goto(boardPath);
  const add = owner.page.getByRole("form", { name: "Add member" });
  await add.getByRole("textbox", { name: "Member email" }).fill(member.email);
  await add.getByRole("button", { name: "Add member" }).click();
  await expect(owner.page.getByRole("region", { name: "Project members" }).getByText(member.email)).toBeVisible();

  await member.page.goto(boardPath);
  await openThread(member.page);
  await expect(thread(member.page)).toContainText("No comments yet");
  await thread(member.page).getByRole("textbox", { name: "Add a comment" }).fill("Can we add the pricing table?");
  await thread(member.page).getByRole("button", { name: "Post comment" }).click();
  await expect(thread(member.page).getByText("Can we add the pricing table?")).toBeVisible();
  await expect(thread(member.page).getByRole("button", { name: "Delete comment by Mason" })).toBeVisible();

  await owner.page.reload();
  await openThread(owner.page);
  await expect(thread(owner.page).getByText("Can we add the pricing table?")).toBeVisible();
  await expect(thread(owner.page).getByText("Mason")).toBeVisible();
  await thread(owner.page).getByRole("textbox", { name: "Add a comment" }).fill("Yes, I'll add it.");
  await thread(owner.page).getByRole("button", { name: "Post comment" }).click();
  await expect(thread(owner.page).getByRole("listitem")).toHaveCount(2);

  await member.page.reload();
  await openThread(member.page);
  await expect(thread(member.page).getByRole("listitem")).toHaveCount(2);
  await expect(thread(member.page).getByRole("button", { name: "Delete comment by Olivia" })).toHaveCount(0);

  await thread(owner.page).getByRole("button", { name: "Delete comment by Mason" }).click();
  await expect(thread(owner.page).getByRole("listitem")).toHaveCount(1);

  const tasks = (await (await owner.page.request.get(`/api/v1${boardPath}/tasks`)).json()).tasks;
  const taskId = tasks.find((t: { title: string }) => t.title === "Write release notes").id;
  expect((await outsider.page.request.get(`/api/v1/tasks/${taskId}/comments`)).status()).toBe(404);

  await owner.context.close();
  await member.context.close();
  await outsider.context.close();
});

test("the comment thread fits at 375px without horizontal scrolling", async ({ browser }) => {
  const owner = await newUser(browser, "Ada");
  const boardPath = await createBoard(owner.page, "Narrow");
  await owner.page.setViewportSize({ width: 375, height: 800 });
  await owner.page.goto(boardPath);
  await openThread(owner.page);

  expect(await owner.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await owner.context.close();
});
