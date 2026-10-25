// Config for the hidden HW3 acceptance suite. evaluate.sh copies this folder into a run's
// checkout and sets EVAL_SERVER_CMD to either a production server or (if the build fails) dev.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "acceptance.spec.ts",
  workers: 1,
  reporter: [["json", { outputFile: `${process.env.EVAL_OUT}/acceptance.json` }], ["list"]],
  use: { baseURL: "http://localhost:3100" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.EVAL_SERVER_CMD ?? "npx next start -p 3100",
    url: "http://localhost:3100",
    cwd: process.env.EVAL_APP_DIR,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
