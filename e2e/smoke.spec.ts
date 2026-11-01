import { expect, test } from "@playwright/test";
import { signIn } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("home page shows the app name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Team Task Board" })).toBeVisible();
});
