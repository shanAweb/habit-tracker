from calendar import monthrange
from datetime import date, timedelta
from typing import Iterable, List, Set

from app.models import CheckIn, DashboardStats, ProgressSummary, SeriesPoint
from app.storage import store


def build_dashboard_stats(user_id: str, target_date: date) -> DashboardStats:
    habits = store.list_habits(user_id, active_only=True)
    checkins = store.all_checkins(user_id)
    habit_ids = {habit.id for habit in habits}

    today_checkins = [
        checkin
        for checkin in checkins
        if checkin.date == target_date and checkin.habit_id in habit_ids
    ]

    weekly_dates = [target_date - timedelta(days=offset) for offset in range(6, -1, -1)]
    monthly_dates = _month_dates(target_date)
    weekly_points = _series(weekly_dates, habit_ids, checkins, "%a")
    monthly_points = _series(monthly_dates, habit_ids, checkins, "%d")

    return DashboardStats(
        daily=_summary([target_date], habit_ids, checkins),
        weekly=_summary(weekly_dates, habit_ids, checkins),
        monthly=_summary(monthly_dates, habit_ids, checkins),
        streak=_streak(target_date, habit_ids, checkins),
        active_habits=len(habits),
        today_checkins=today_checkins,
        weekly_series=weekly_points,
        monthly_series=monthly_points,
    )


def _summary(
    dates: Iterable[date],
    habit_ids: Set[str],
    checkins: List[CheckIn],
) -> ProgressSummary:
    date_list = list(dates)
    total = len(date_list) * len(habit_ids)
    completed = sum(
        1
        for checkin in checkins
        if checkin.date in date_list and checkin.habit_id in habit_ids
    )
    return ProgressSummary(
        completed=completed,
        total=total,
        percentage=_percentage(completed, total),
    )


def _series(
    dates: Iterable[date],
    habit_ids: Set[str],
    checkins: List[CheckIn],
    label_format: str,
) -> List[SeriesPoint]:
    points = []
    for current_date in dates:
        summary = _summary([current_date], habit_ids, checkins)
        points.append(
            SeriesPoint(
                label=current_date.strftime(label_format),
                completed=summary.completed,
                total=summary.total,
                percentage=summary.percentage,
            )
        )
    return points


def _streak(target_date: date, habit_ids: Set[str], checkins: List[CheckIn]) -> int:
    if not habit_ids:
        return 0

    streak = 0
    current_date = target_date
    checkin_pairs = {(checkin.habit_id, checkin.date) for checkin in checkins}
    while all((habit_id, current_date) in checkin_pairs for habit_id in habit_ids):
        streak += 1
        current_date -= timedelta(days=1)
    return streak


def _month_dates(target_date: date) -> List[date]:
    days = monthrange(target_date.year, target_date.month)[1]
    return [date(target_date.year, target_date.month, day) for day in range(1, days + 1)]


def _percentage(completed: int, total: int) -> int:
    if total == 0:
        return 0
    return round((completed / total) * 100)
