# Team Task Board — Product Requirements (v1, 2026-10-25)

CS6983 Project 2 (pair project). Open for partner review.

## 1. Goal

Small teams lose track of who is doing what when tasks live in chat threads and personal notes. Team Task Board gives each project one shared Kanban board (**To Do → In Progress → Done**) and a small documented REST API, so a team can see every task's status at a glance.

## 2. Target users

- **Student project teams (2–5 people):** need a lightweight board without the setup cost of Jira or Asana.
- **API clients and scripts:** want to create or read tasks programmatically, for example from a CI job.

## 3. User stories and acceptance criteria

| ID | Story |
|---|---|
| US1 | As a new user, I want to register and log in so that my projects are private to me. |
| US2 | As a user, I want to create, list, and delete projects so that I can group related work. |
| US3 | As a user, I want to create, edit, and delete tasks in a project so that the board reflects real work. |
| US4 | As a user, I want to see a project's tasks on a three-column board and change a task's status so that progress is visible at a glance. |
| US5 | As a developer, I want a documented REST API so that I can integrate the board with scripts. |

**US1. Authentication**
- [ ] Register with email, name, and password (8+ characters). A duplicate email is rejected with a clear message.
- [ ] Passwords are stored as bcrypt hashes. Login issues a JWT in an httpOnly, SameSite=Lax cookie. API clients can send it as `Authorization: Bearer <token>`.
- [ ] Pages and API routes other than login and register return 401 or redirect to `/login` when the user is not authenticated.

**US2. Projects**
- [ ] A user can create a project with a name (1–80 characters) and see their projects listed newest first.
- [ ] A user can delete their own project after a confirmation step. The project's tasks are deleted with it.
- [ ] Requesting another user's project returns 404, never the data.

**US3. Tasks**
- [ ] Create a task with a title (1–120 characters, required) and an optional description. Status defaults to To Do.
- [ ] Edit a task's title and description. Delete a task after a confirmation step.
- [ ] All task operations are scoped to projects the user owns.

**US4. Board** (Sprint 1 builds it on local mock data; Sprint 2 connects it to the API)
- [ ] The board at `/projects/[projectId]` shows three columns titled **To Do**, **In Progress**, and **Done**, in that order.
- [ ] Each task appears as a card in the column matching its status. Each card shows the title and, if present, the description.
- [ ] Each column header shows the number of tasks in that column.
- [ ] Each card has a status dropdown with the options To Do, In Progress, and Done. Its accessible name identifies the task, for example "Status for Write release notes".
- [ ] Changing the dropdown moves the card to the new column immediately and updates the counts.
- [ ] A column with no tasks shows the message "No tasks yet".
- [ ] The three columns sit side by side at 768px and wider, and stack vertically below that. There is no horizontal page scroll at 375px.
- [ ] Sprint 2: a status change is saved through the API. If the request fails, the card returns to its previous column and an error message is shown.

**US5. Public API**
- [ ] Every `/api/v1` endpoint is described in an OpenAPI 3 document, viewable at `/api/docs`.
- [ ] Errors use the shape `{ "error": { "code": string, "message": string } }`.

## 4. Design reference

- Mockup: [`docs/mockups/board.png`](mockups/board.png) (1280px) and [`docs/mockups/board-mobile.png`](mockups/board-mobile.png) (375px). The source is [`docs/mockups/board.html`](mockups/board.html).
- Visual language: light zinc background; white cards with a 1px border and 8px radius; each column has a colored top border (To Do slate, In Progress blue, Done green); the count is a pill badge; the empty state is a dashed box.
- Interaction: native `<select>` for status, keyboard operable, visible focus ring. No drag-and-drop.

## 5. MVP scope

**In scope:** US1–US5.

**Explicitly out of scope:** drag-and-drop, real-time sync or WebSockets, notifications, team invitations and roles, due dates, comments, file attachments, OAuth providers, mobile apps.

## 6. Data model (Prisma, planned for Sprint 1)

```
User    (id, email unique, name, passwordHash, createdAt)
Project (id, name, ownerId → User, createdAt)                 on delete cascade
Task    (id, projectId → Project, title, description?, status TODO|IN_PROGRESS|DONE,
         createdAt, updatedAt)                                  index (projectId, status)
```

## 7. Architecture

```
Browser (React client components)  ─┐
API client (Bearer JWT)            ─┤  fetch /api/v1/*
                                     ▼
Next.js App Router route handlers (src/app/api/v1/**/route.ts)
  auth check → input validation → service call → JSON response
                                     ▼
Services (src/server/services/*) → Prisma → PostgreSQL (Neon in prod and preview)
```

The UI and external clients use the same `/api/v1` endpoints, so there is one API surface to test and document. Deployment uses Vercel, with a preview deployment for each PR and production deploys from `main`.

## 8. Roadmap

| Sprint | Dates | Goal (demoable increment) |
|---|---|---|
| Setup | Oct 23–25 | Scaffold, PRD, mockup, GitHub board and issues |
| Sprint 1 | Oct 26 – Nov 2 | Database schema, CI, deployment, authentication, projects, board on mock data |
| Sprint 2 | Nov 3 – Nov 10 | Tasks API, board connected to the API, task editing UI, security scanning, OpenAPI docs, E2E tests, documentation |
| Buffer | Nov 11–12 | Integration fixes, demo video, submission |

The backlog lives in the GitHub Project "Team Task Board"; each issue lists its acceptance criteria and dependencies.
