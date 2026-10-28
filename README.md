# Team Task Board

A minimal Kanban task board (CS6983 Project 2). Product requirements: [docs/prd.md](docs/prd.md). Board mockup: [docs/mockups/board.png](docs/mockups/board.png). Development workflow: Visual Studio Code with GitHub Copilot Chat.

## Local setup

```bash
npm install
cp .env.example .env
docker compose up -d db
npx prisma migrate dev
npx playwright install chromium   # first time only
npm run dev                        # http://localhost:3000
```

The database configuration uses PostgreSQL via the local Docker service in `docker-compose.yml`. The Prisma schema expects a `DATABASE_URL` value in `.env` (documented in `.env.example`).

## Checks

```bash
npm run lint
npm run typecheck
npm test            # Vitest unit/component tests
npm run test:e2e    # Playwright (builds and starts the app)
```
