from datetime import date
from typing import List

from fastapi import APIRouter, HTTPException, Query, Response, status

from app.events import event_hub
from app.models import CheckIn, CheckInCreate, DashboardStats, Habit, HabitCreate
from app.services import build_dashboard_stats
from app.storage import store

router = APIRouter(prefix="/api", tags=["habits"])


@router.get("/habits", response_model=List[Habit])
def list_habits() -> List[Habit]:
    return store.list_habits(active_only=True)


@router.post("/habits", response_model=Habit, status_code=status.HTTP_201_CREATED)
async def create_habit(payload: HabitCreate) -> Habit:
    habit = store.create_habit(payload)
    await event_hub.broadcast_change()
    return habit


@router.delete("/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(habit_id: str) -> Response:
    if not store.deactivate_habit(habit_id):
        raise HTTPException(status_code=404, detail="Habit not found")
    await event_hub.broadcast_change()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/checkins", response_model=List[CheckIn])
def list_checkins(target_date: date = Query(alias="date")) -> List[CheckIn]:
    return store.list_checkins(target_date)


@router.post("/checkins", response_model=CheckIn, status_code=status.HTTP_201_CREATED)
async def create_checkin(payload: CheckInCreate) -> CheckIn:
    try:
        checkin = store.add_checkin(payload.habit_id, payload.date)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    await event_hub.broadcast_change()
    return checkin


@router.delete("/checkins/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checkin(
    habit_id: str,
    target_date: date = Query(alias="date"),
) -> Response:
    if store.remove_checkin(habit_id, target_date):
        await event_hub.broadcast_change()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(target_date: date = Query(alias="date")) -> DashboardStats:
    return build_dashboard_stats(target_date)
