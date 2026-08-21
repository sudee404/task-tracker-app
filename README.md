# Team Task Tracker

A small team task tracker: a two-column board you can drag tasks across, with
assignment, search, filtering, priorities, due dates and per-user permissions.
Django + DRF on the back, React + TypeScript on the front. Light and dark.

Built for the Spark Tutoring full-stack challenge.

## Running it

You need Docker (for Postgres), Python 3.11+ and Node 20+.

```bash
# 1. Database
cp .env.example .env
docker compose up -d          # Postgres on localhost:5433

# 2. Backend  ->  http://localhost:8001
cd backend
uv venv && uv pip install -e . && uv pip install pytest pytest-django
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_team
.venv/bin/python manage.py runserver 8001

# 3. Frontend ->  http://localhost:5173
cd ../frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in as any of `amara`, `ben`, `priya` or
`sofia` — the password is `password123` (set via `SEED_PASSWORD`).

Ports 5433 and 8001 are deliberate: 5432 and 8000 were already taken on the
development machine.

## Tests

```bash
cd backend  && .venv/bin/python -m pytest   # 38 tests
cd frontend && npm test                     # 31 tests
```

The backend suite runs against in-memory SQLite, so it needs no container.
The frontend suite mocks the API with MSW.

## How it fits together

```
frontend/  Vite + React + TypeScript   :5173  ──/api──▶  backend/  Django + DRF  :8001  ──▶  Postgres :5433
```

Vite proxies `/api` to Django, so the browser sees a single origin. That is
what lets Django's own session and CSRF cookies work end to end, with no CORS
configuration and no tokens in `localStorage`.

**Backend.** One `Task` model (title, description, `is_complete`, priority, due
date, assignee, creator). A DRF `ModelViewSet` at `/api/tasks/` covers the
whole lifecycle; `/api/users/` supplies the team roster for the assignment
dropdown; `/api/auth/{login,logout,me}` handles sessions. Filtering and search
ride on the list endpoint through django-filter rather than bespoke endpoints.

**Permissions.** Anyone signed in can read and add. Editing and completing a
task need a stake in it — you created it or it is assigned to you. Deleting is
the creator's alone, so an assignee cannot destroy work someone else is
tracking. `TaskPermission` is the gate; the serializer also returns `can_edit`
and `can_delete` so the UI can hide controls it may not use.

**Frontend.** A typed `fetch` wrapper handles the CSRF header and turns DRF's
error payloads into field-level messages. React Query owns server state, so
every mutation invalidates the task list and the view refetches itself instead
of hand-rolled cache updates. `AuthProvider` asks `/api/auth/me/` once on boot
to decide between the login screen and the app.

**The board.** To do and Done are two independent queries (`?status=incomplete`
and `?status=complete`), each with its own count and its own "Load more". A
single paged list split into columns would let page two arrive all-Done, which
is why they are separate. Dragging a card between columns is native HTML5 drag
— no library — and it is never the only route: every card keeps a checkbox, so
the board works from the keyboard too.

## Decisions worth mentioning

- **Completion is a `PATCH`, not a custom action.** Ticking a checkbox and
  editing a title go through the same code path, which leaves one less
  endpoint to document and test.
- **Team members are real Django users, not a hard-coded list.** The brief
  allows hard-coding, but since login was in scope anyway, one `User` table
  feeds both authentication and the assignee dropdown.
- **Postgres in Docker, SQLite in tests.** Production-shaped locally; the test
  suite still runs in under a second with nothing to start first.
- **No router.** The app has two states, not two routes, so `App` renders
  either the login screen or the task list. A router would be ceremony.
- **Validation lives in the serializer.** The client renders whatever DRF
  returns, so a blank title is rejected in one place rather than two. A 400
  shows beside the offending field and deliberately raises no toast; anything
  else (403, 404, network) does, because it would otherwise fail silently.
- **Completion is optimistic.** The checkbox flips immediately and rolls back
  if the server refuses, so the common case feels instant and the rare failure
  is still honest. Every cached page is patched, because a task can sit in more
  than one cached query.
- **One token layer, two themes.** Every colour is a CSS variable; dark mode
  redefines the variables and nothing else. `--color-on-accent` exists because
  white-on-accent reads in light mode but fails against the lighter dark-mode
  accent.
- **Users never see DRF's internals.** A 404 body says "No Task matches the
  given query"; the toast says the task no longer exists.

## What I would do next

- Keyboard drag-and-drop. Dragging has a checkbox fallback, but moving a card
  between columns without a mouse is a click, not a drag.
- Real-time updates. Two people on the same board only see each other's changes
  on the next refetch.
- Editing from the card rather than a modal — retitling costs three clicks.
- Activity history, so "who completed this and when" is answerable.
