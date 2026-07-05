import asyncio
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.habits import router as habits_router
from app.api.notifications import router as notifications_router
from app.core.config import ALLOWED_ORIGINS
from app.events import event_hub
from app.reminder_scheduler import reminder_loop

app = FastAPI(title="Habit Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(habits_router)
app.include_router(notifications_router)

reminder_task: Optional[asyncio.Task] = None


@app.on_event("startup")
async def start_reminders() -> None:
    global reminder_task
    reminder_task = asyncio.create_task(reminder_loop())


@app.on_event("shutdown")
async def stop_reminders() -> None:
    if reminder_task:
        reminder_task.cancel()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await event_hub.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        event_hub.disconnect(websocket)
