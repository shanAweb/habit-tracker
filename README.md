# Habit Tracker

A professional habit tracking web app built as a monorepo with:

- `backend/`: FastAPI API for habits, daily check-ins, dashboard stats, and WebSocket updates.
- `frontend/`: Next.js app with dashboard graphs, habit management, and daily check-in pages.

## Features

- Dashboard progress for daily, weekly, and monthly completion.
- Animated progress ring and bar charts.
- Add and remove habits.
- Mark and unmark daily habit check-ins.
- Dashboard refreshes immediately after check-ins and receives live WebSocket updates.
- JWT authentication with signup, login, forgot password, and reset password flows.
- Profile settings, habit frequency options, reminders, habit detail analytics, calendar backfill, category filtering, and CSV export.

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs on `http://localhost:8000`.

Set a production `JWT_SECRET` before deploying the backend.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The web app runs on `http://localhost:3000`.

## Environment

The frontend defaults to the local API. To override it, copy `frontend/.env.example` to
`frontend/.env.local` and set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```text
backend/
  app/
    api/
    core/
frontend/
  app/
  components/
  hooks/
  lib/
```
