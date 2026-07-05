from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.dependencies import current_user
from app.events import event_hub
from app.models import CheckIn, CheckInCreate, DashboardStats, Habit, HabitCreate, User
from app.services import build_dashboard_stats
from app.storage import store

router = APIRouter(prefix="/api", tags=["habits"])


@router.get("/habits", response_model=List[Habit])
def list_habits(user: User = Depends(current_user)) -> List[Habit]:
    return store.list_habits(user.id, active_only=True)


@router.post("/habits", response_model=Habit, status_code=status.HTTP_201_CREATED)
async def create_habit(
    payload: HabitCreate,
    user: User = Depends(current_user),
) -> Habit:
    habit = store.create_habit(user.id, payload)
    await event_hub.broadcast_change()
    return habit


@router.delete("/habits/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_habit(
    habit_id: str,
    user: User = Depends(current_user),
) -> Response:
    if not store.deactivate_habit(user.id, habit_id):
        raise HTTPException(status_code=404, detail="Habit not found")
    await event_hub.broadcast_change()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/checkins", response_model=List[CheckIn])
def list_checkins(
    target_date: date = Query(alias="date"),
    user: User = Depends(current_user),
) -> List[CheckIn]:
    return store.list_checkins(user.id, target_date)


@router.post("/checkins", response_model=CheckIn, status_code=status.HTTP_201_CREATED)
async def create_checkin(
    payload: CheckInCreate,
    user: User = Depends(current_user),
) -> CheckIn:
    try:
        checkin = store.add_checkin(user.id, payload.habit_id, payload.date)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    await event_hub.broadcast_change()
    return checkin


@router.delete("/checkins/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checkin(
    habit_id: str,
    target_date: date = Query(alias="date"),
    user: User = Depends(current_user),
) -> Response:
    if store.remove_checkin(user.id, habit_id, target_date):
        await event_hub.broadcast_change()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    target_date: date = Query(alias="date"),
    user: User = Depends(current_user),
) -> DashboardStats:
    return build_dashboard_stats(user.id, target_date)
