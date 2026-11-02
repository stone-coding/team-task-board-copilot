# 001. Stateless JWT sessions in an httpOnly cookie

- Status: accepted (#4)
- Date: 2026-11-01

## Context
US1 requires bcrypt password hashes, a JWT in an httpOnly, SameSite=Lax cookie, Bearer tokens for API clients, and 401 or a redirect to `/login` for unauthenticated requests to anything except login and register.

## Decision
- **Tokens:** `jose` HS256, `sub` = user id, 7-day expiry, key from `JWT_SECRET`. Login sets the `session` cookie (httpOnly, Secure, SameSite=Lax, Path=/) and also returns the token in the body for Bearer clients. Bearer takes precedence when both are sent.
- **Passwords:** `bcryptjs`, cost 12, 8–72 characters (bcrypt ignores bytes past 72). Unknown emails are still compared against a dummy hash so both login failures take similar time and return the same message.
- **Enforcement:** `src/proxy.ts` (Next.js 16's replacement for middleware) redirects pages to `/login?next=…` and returns 401 JSON for `/api/*`. It is an optimistic check; every protected route handler re-verifies with `getAuthenticatedUserId` before reading data. `next` only accepts same-site paths (`safeNextPath`).
- **Registration** does not start a session; the UI redirects to `/login?registered=1`.
- **Every page is protected**, including `/` and `/projects/demo`, because US1 criterion 4 covers all pages except login and register. The #6 board and smoke E2E specs therefore sign in first; their assertions are unchanged.

## Consequences
- Stateless: logout clears the cookie but cannot revoke an already-issued token before it expires. Revocation would need a token denylist or database sessions (new issue).
- Rotating `JWT_SECRET` logs everyone out.
- `Secure` cookies work on `http://localhost` in Chromium; other browsers on plain HTTP hosts would drop them.
