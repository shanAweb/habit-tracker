from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    category: str = Field(default="Personal", max_length=40)
    color: str = Field(default="#f97316", pattern=r"^#[0-9a-fA-F]{6}$")
    frequency: str = Field(default="daily", pattern=r"^(daily|weekdays|weekly|monthly)$")
    weekdays: List[int] = Field(default_factory=list)
    target_count: int = Field(default=3, ge=1, le=7)
    monthly_target: int = Field(default=20, ge=1, le=31)
    reminder_enabled: bool = False
    reminder_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")


class HabitUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    category: str = Field(default="Personal", max_length=40)
    color: str = Field(default="#f97316", pattern=r"^#[0-9a-fA-F]{6}$")
    frequency: str = Field(default="daily", pattern=r"^(daily|weekdays|weekly|monthly)$")
    weekdays: List[int] = Field(default_factory=list)
    target_count: int = Field(default=3, ge=1, le=7)
    monthly_target: int = Field(default=20, ge=1, le=31)
    reminder_enabled: bool = False
    reminder_time: Optional[str] = Field(default=None, pattern=r"^\d{2}:\d{2}$")


class Habit(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    color: str
    created_at: datetime
    active: bool = True
    frequency: str = "daily"
    weekdays: List[int] = Field(default_factory=list)
    target_count: int = 3
    monthly_target: int = 20
    reminder_enabled: bool = False
    reminder_time: Optional[str] = None


class CheckInCreate(BaseModel):
    habit_id: str
    date: date
    note: str = Field(default="", max_length=240)


class CheckIn(BaseModel):
    user_id: str
    habit_id: str
    date: date
    completed_at: datetime
    note: str = ""


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
    timezone: str = "UTC"
    week_start: int = Field(default=0, ge=0, le=6)


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime
    timezone: str = "UTC"
    week_start: int = 0


class ProfileUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    email: str = Field(..., min_length=5, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    timezone: str = Field(default="UTC", max_length=60)
    week_start: int = Field(default=0, ge=0, le=6)


class PasswordChange(BaseModel):
    current_password: str = Field(..., min_length=8, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


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


class HabitInsight(BaseModel):
    habit_id: str
    name: str
    value: int


class DashboardAnalytics(BaseModel):
    best_habit: Optional[HabitInsight] = None
    most_missed_habit: Optional[HabitInsight] = None
    weekly_trend: int = 0
    monthly_trend: int = 0
    streak_milestone: str = ""
    at_risk: List[HabitInsight] = Field(default_factory=list)


class DashboardStats(BaseModel):
    daily: ProgressSummary
    weekly: ProgressSummary
    monthly: ProgressSummary
    streak: int
    active_habits: int
    today_checkins: List[CheckIn]
    weekly_series: List[SeriesPoint]
    monthly_series: List[SeriesPoint]
    analytics: DashboardAnalytics = Field(default_factory=DashboardAnalytics)


class HeatmapDay(BaseModel):
    date: date
    completed: bool
    missed: bool
    note: str = ""


class HabitDetail(BaseModel):
    habit: Habit
    current_streak: int
    longest_streak: int
    completion_rate: int
    missed_days: int
    heatmap: List[HeatmapDay]


class CalendarHabitStatus(BaseModel):
    habit_id: str
    name: str
    completed: bool
    due: bool


class CalendarDay(BaseModel):
    date: date
    completed: int
    due: int
    habits: List[CalendarHabitStatus]
