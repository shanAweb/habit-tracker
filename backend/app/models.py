from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    category: str = Field(default="Personal", max_length=40)
    color: str = Field(default="#f97316", pattern=r"^#[0-9a-fA-F]{6}$")


class Habit(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    color: str
    created_at: datetime
    active: bool = True


class CheckInCreate(BaseModel):
    habit_id: str
    date: date


class CheckIn(BaseModel):
    user_id: str
    habit_id: str
    date: date
    completed_at: datetime


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    email: str = Field(..., min_length=5, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: str = Field(..., min_length=5, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(..., min_length=8, max_length=128)


class User(BaseModel):
    id: str
    name: str
    email: str
    password_hash: str
    created_at: datetime


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ForgotPasswordResponse(BaseModel):
    message: str
    reset_token: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=20)
    password: str = Field(..., min_length=8, max_length=128)


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
