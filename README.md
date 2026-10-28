# Team Task Board

A minimal Kanban task board (CS6983 Project 2). Product requirements: [docs/prd.md](docs/prd.md). Board mockup: [docs/mockups/board.png](docs/mockups/board.png). Development workflow: Visual Studio Code with GitHub Copilot Chat.

## Local setup

```bash
npm install
npx playwright install chromium   # first time only
docker compose up -d postgres
cp .env.example .env
npx prisma migrate dev
npm run dev                        # http://localhost:3000
```

If port `5432` is already in use, set `POSTGRES_PORT` to another host port when starting Compose and update `DATABASE_URL` in `.env` to match.

## Checks

```bash
npm run lint
npm run typecheck
npm test            # Vitest unit/component tests
npm run test:e2e    # Playwright (builds and starts the app)
```
