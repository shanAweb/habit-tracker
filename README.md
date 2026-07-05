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
- Closed-app Web Push notifications for habit reminder times when VAPID keys are configured.

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

For closed-app push notifications, generate VAPID keys:

```bash
cd backend
.venv/bin/python -m py_vapid --gen
.venv/bin/python -m py_vapid --applicationServerKey --private-key private_key.pem
```

Set `VAPID_PUBLIC_KEY` to the application server key, and set either
`VAPID_PRIVATE_KEY` to the PEM contents or `VAPID_PRIVATE_KEY_FILE` to the PEM file path.

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
