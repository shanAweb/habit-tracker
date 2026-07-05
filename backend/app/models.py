from datetime import date, datetime
from typing import List

from pydantic import BaseModel, Field


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    category: str = Field(default="Personal", max_length=40)
    color: str = Field(default="#f97316", pattern=r"^#[0-9a-fA-F]{6}$")


class Habit(BaseModel):
    id: str
    name: str
    category: str
    color: str
    created_at: datetime
    active: bool = True


class CheckInCreate(BaseModel):
    habit_id: str
    date: date


class CheckIn(BaseModel):
    habit_id: str
    date: date
    completed_at: datetime


class ProgressSummary(BaseModel):
    completed: int
    total: int
    percentage: int


class SeriesPoint(BaseModel):
    label: str
    completed: int
    total: int
    percentage: int


class DashboardStats(BaseModel):
    daily: ProgressSummary
    weekly: ProgressSummary
    monthly: ProgressSummary
    streak: int
    active_habits: int
    today_checkins: List[CheckIn]
    weekly_series: List[SeriesPoint]
    monthly_series: List[SeriesPoint]
