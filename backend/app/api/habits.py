from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.responses import PlainTextResponse

from app.dependencies import current_user
from app.events import event_hub
from app.models import (
    CalendarDay,
    CheckIn,
    CheckInCreate,
    DashboardStats,
    Habit,
    HabitCreate,
    HabitDetail,
    HabitUpdate,
    User,
)
from app.services import build_calendar, build_dashboard_stats, build_habit_detail
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


@router.put("/habits/{habit_id}", response_model=Habit)
async def update_habit(
    habit_id: str,
    payload: HabitUpdate,
    user: User = Depends(current_user),
) -> Habit:
    try:
        habit = store.update_habit(user.id, habit_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    await event_hub.broadcast_change()
    return habit


@router.get("/habits/{habit_id}", response_model=HabitDetail)
def habit_detail(
    habit_id: str,
    target_date: date = Query(alias="date"),
    user: User = Depends(current_user),
) -> HabitDetail:
    detail = build_habit_detail(user.id, habit_id, target_date)
    if detail is None:
        raise HTTPException(status_code=404, detail="Habit not found")
    return detail


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
        checkin = store.add_checkin(user.id, payload.habit_id, payload.date, payload.note)
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
    return build_dashboard_stats(user.id, target_date, user.week_start)


@router.get("/calendar", response_model=List[CalendarDay])
def calendar(
    target_date: date = Query(alias="date"),
    user: User = Depends(current_user),
) -> List[CalendarDay]:
    return build_calendar(user.id, target_date)


@router.get("/export/checkins", response_class=PlainTextResponse)
def export_checkins(user: User = Depends(current_user)) -> PlainTextResponse:
    habits = {habit.id: habit for habit in store.list_habits(user.id, active_only=False)}
    rows = ["date,habit,category,note"]
    for checkin in sorted(store.all_checkins(user.id), key=lambda item: item.date):
        habit = habits.get(checkin.habit_id)
        if habit:
            rows.append(
                f"{checkin.date},{_csv(habit.name)},{_csv(habit.category)},{_csv(checkin.note)}"
            )
    return PlainTextResponse("\n".join(rows), media_type="text/csv")


def _csv(value: str) -> str:
    escaped = value.replace('"', '""')
    return f'"{escaped}"'
