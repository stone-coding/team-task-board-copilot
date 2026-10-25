# Team Task Board

A minimal Kanban task board (CS6983 Project 2). Product requirements: [docs/prd.md](docs/prd.md). Board mockup: [docs/mockups/board.png](docs/mockups/board.png). Development workflow: Visual Studio Code with GitHub Copilot Chat.

## Local setup

```bash
npm install
npx playwright install chromium   # first time only
npm run dev                        # http://localhost:3000
```

## Checks

```bash
npm run lint
npm run typecheck
npm test            # Vitest unit/component tests
npm run test:e2e    # Playwright (builds and starts the app)
```
