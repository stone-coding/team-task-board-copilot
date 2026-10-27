# Team Task Board

A minimal Kanban task board (CS6983 Project 2). Product requirements: [docs/prd.md](docs/prd.md). Board mockup: [docs/mockups/board.png](docs/mockups/board.png). Development workflow: Visual Studio Code with GitHub Copilot Chat.

## Local setup

```bash
npm install
npx playwright install chromium   # first time only
npm run dev                        # http://localhost:3000
```

## Database setup

Prisma uses PostgreSQL and requires Node.js 20.19 or later. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string, then generate the client and apply the checked-in migration:

```bash
cp .env.example .env
npx prisma generate
npx prisma migrate dev
```

## Checks

```bash
npm run lint
npm run typecheck
npm test            # Vitest unit/component tests
npm run test:e2e    # Playwright (builds and starts the app)
```
