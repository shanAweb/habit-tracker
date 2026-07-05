from calendar import monthrange
from datetime import date, timedelta
from typing import Iterable, List

from app.models import Habit


def month_dates(target: date) -> List[date]:
    days = monthrange(target.year, target.month)[1]
    return [date(target.year, target.month, day) for day in range(1, days + 1)]


def week_dates(target: date, week_start: int = 0) -> List[date]:
    start = target - timedelta(days=(target.weekday() - week_start) % 7)
    return [start + timedelta(days=offset) for offset in range(7)]


def expected_for_period(habit: Habit, dates: Iterable[date]) -> int:
    date_list = list(dates)
    if habit.frequency == "daily":
        return len(date_list)
    if habit.frequency == "weekdays":
        weekdays = set(habit.weekdays or [0, 1, 2, 3, 4])
        return sum(1 for item in date_list if item.weekday() in weekdays)
    if habit.frequency == "weekly":
        weeks = {item.isocalendar()[:2] for item in date_list}
        return len(weeks) * habit.target_count
    if habit.frequency == "monthly":
        months = {(item.year, item.month) for item in date_list}
        return len(months) * habit.monthly_target
    return len(date_list)


def is_due_on(habit: Habit, target: date) -> bool:
    if habit.frequency == "daily":
        return True
    if habit.frequency == "weekdays":
        return target.weekday() in set(habit.weekdays or [0, 1, 2, 3, 4])
    return True


def date_range(start: date, end: date) -> List[date]:
    days = (end - start).days
    return [start + timedelta(days=offset) for offset in range(days + 1)]
