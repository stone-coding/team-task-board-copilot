import { expect, test, type Browser } from "@playwright/test";
import { E2E_PASSWORD } from "./helpers/auth";
import { createBoard } from "./helpers/board";

// Distinct names, so assignee options and labels are unambiguous.
async function newUser(browser: Browser, name: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `e2e-${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  expect((await page.request.post("/api/v1/auth/register", { data: { email, name, password: E2E_PASSWORD } })).status()).toBe(201);
  expect((await page.request.post("/api/v1/auth/login", { data: { email, password: E2E_PASSWORD } })).status()).toBe(200);
  return { context, page, email };
}

test("assign a task to a member, see it from both accounts, filter by assignee, and unassign on removal", async ({ browser }) => {
  const owner = await newUser(browser, "Olivia");
  const member = await newUser(browser, "Mason");
  const boardPath = await createBoard(owner.page, "Assignments");
  await owner.page.goto(boardPath);

  const addMember = owner.page.getByRole("form", { name: "Add member" });
  await addMember.getByRole("textbox", { name: "Member email" }).fill(member.email);
  await addMember.getByRole("button", { name: "Add member" }).click();
  await expect(owner.page.getByRole("region", { name: "Project members" }).getByText(member.email)).toBeVisible();

  await owner.page.getByRole("button", { name: "Edit Write release notes" }).click();
  const edit = owner.page.getByRole("form", { name: "Edit Write release notes" });
  await edit.getByRole("combobox", { name: "Assignee" }).selectOption({ label: "Mason" });
  const saved = owner.page.waitForResponse((response) => response.request().method() === "PATCH" && response.ok());
  await edit.getByRole("button", { name: "Save" }).click();
  await saved;
  const card = (page: typeof owner.page) =>
    page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Write release notes" }) });
  await expect(card(owner.page).getByText("Assigned to Mason")).toBeVisible();

  await member.page.goto(boardPath);
  await expect(card(member.page).getByText("Assigned to Mason")).toBeVisible();
  await member.page.getByRole("combobox", { name: "Filter by assignee" }).selectOption({ label: "Mason" });
  await expect(member.page.getByRole("region").getByRole("heading", { level: 3 })).toHaveText(["Write release notes"]);

  await owner.page.getByRole("button", { name: "Remove Mason" }).click();
  await expect(owner.page.getByRole("region", { name: "Project members" }).getByText(member.email)).toHaveCount(0);
  await owner.page.reload();
  await expect(card(owner.page).getByText("Unassigned")).toBeVisible();

  await owner.context.close();
  await member.context.close();
});

test("a task can be created already assigned", async ({ browser }) => {
  const owner = await newUser(browser, "Ada");
  const boardPath = await createBoard(owner.page, "Create assigned", []);
  await owner.page.goto(boardPath);

  const form = owner.page.getByRole("form", { name: "Add task" });
  await form.getByRole("textbox", { name: "Title" }).fill("Mine from the start");
  await form.getByRole("combobox", { name: "Assignee" }).selectOption({ label: "Ada" });
  await form.getByRole("button", { name: "Add task" }).click();

  const card = owner.page.getByRole("listitem").filter({ has: owner.page.getByRole("heading", { name: "Mine from the start" }) });
  await expect(card.getByText("Assigned to Ada")).toBeVisible();
  await owner.page.reload();
  await expect(card.getByText("Assigned to Ada")).toBeVisible();
  await owner.context.close();
});
