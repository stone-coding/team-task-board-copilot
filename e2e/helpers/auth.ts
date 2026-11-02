import { expect, type Page } from "@playwright/test";

export const E2E_PASSWORD = "correct-horse";

export function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

// Registers a fresh user and logs in through the API; page.request shares the browser's cookie jar.
export async function signIn(page: Page) {
  const email = uniqueEmail();
  const registered = await page.request.post("/api/v1/auth/register", {
    data: { email, name: "E2E User", password: E2E_PASSWORD },
  });
  expect(registered.status()).toBe(201);
  const loggedIn = await page.request.post("/api/v1/auth/login", { data: { email, password: E2E_PASSWORD } });
  expect(loggedIn.status()).toBe(200);
  return email;
}
