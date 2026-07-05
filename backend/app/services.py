from datetime import date, timedelta
from typing import Iterable, List, Optional

from app.models import (
    CalendarDay,
    CalendarHabitStatus,
    CheckIn,
    DashboardAnalytics,
    DashboardStats,
    Habit,
    HabitDetail,
    HabitInsight,
    HeatmapDay,
    ProgressSummary,
    SeriesPoint,
)
from app.schedule import date_range, expected_for_period, is_due_on, month_dates, week_dates
from app.storage import store


def build_dashboard_stats(user_id: str, target_date: date, week_start: int = 0) -> DashboardStats:
    habits = store.list_habits(user_id, active_only=True)
    checkins = store.all_checkins(user_id)
    weekly_dates = week_dates(target_date, week_start)
    monthly_dates = month_dates(target_date)
    return DashboardStats(
        daily=_summary(habits, [target_date], checkins),
        weekly=_summary(habits, weekly_dates, checkins),
        monthly=_summary(habits, monthly_dates, checkins),
        streak=_streak(habits, target_date, checkins),
        active_habits=len(habits),
        today_checkins=[item for item in checkins if item.date == target_date],
        weekly_series=_series(habits, weekly_dates, checkins, "%a"),
        monthly_series=_series(habits, monthly_dates, checkins, "%d"),
        analytics=_analytics(habits, checkins, target_date, week_start),
    )


def build_habit_detail(user_id: str, habit_id: str, target_date: date) -> Optional[HabitDetail]:
    habit = store.get_habit(user_id, habit_id)
    if not habit:
        return None
    checkins = [item for item in store.all_checkins(user_id) if item.habit_id == habit.id]
    start = target_date - timedelta(days=89)
    days = date_range(start, target_date)
    heatmap = [_heatmap_day(habit, item, checkins, target_date) for item in days]
    due_days = [item for item in heatmap if item.missed or item.completed]
    missed = sum(1 for item in heatmap if item.missed)
    completed = sum(1 for item in heatmap if item.completed)
    return HabitDetail(
        habit=habit,
        current_streak=_habit_streak(habit, target_date, checkins),
        longest_streak=_longest_streak(habit, heatmap),
        completion_rate=_percentage(completed, len(due_days)),
        missed_days=missed,
        heatmap=heatmap,
    )


def build_calendar(user_id: str, target_date: date) -> List[CalendarDay]:
    habits = store.list_habits(user_id, active_only=True)
    checkins = store.all_checkins(user_id)
    days = []
    for item in month_dates(target_date):
        statuses = [_calendar_status(habit, item, checkins) for habit in habits]
        days.append(CalendarDay(
            date=item,
            completed=sum(1 for status in statuses if status.completed),
            due=sum(1 for status in statuses if status.due),
            habits=statuses,
        ))
    return days


def _summary(habits: List[Habit], dates: Iterable[date], checkins: List[CheckIn]) -> ProgressSummary:
    date_list = list(dates)
    total = sum(expected_for_period(habit, date_list) for habit in habits)
    completed = sum(
        min(
            expected_for_period(habit, date_list),
            _habit_completed(habit, checkins, date_list),
        )
        for habit in habits
    )
    return ProgressSummary(completed=completed, total=total, percentage=_percentage(completed, total))


def _series(habits: List[Habit], dates: Iterable[date], checkins: List[CheckIn], label_format: str) -> List[SeriesPoint]:
    return [
        SeriesPoint(label=item.strftime(label_format), **_summary(habits, [item], checkins).model_dump())
        for item in dates
    ]


def _analytics(habits: List[Habit], checkins: List[CheckIn], today: date, week_start: int) -> DashboardAnalytics:
    week = week_dates(today, week_start)
    month = month_dates(today)
    previous_week = [item - timedelta(days=7) for item in week]
    previous_month = [item - timedelta(days=30) for item in month]
    return DashboardAnalytics(
        best_habit=_best_habit(habits, checkins, month),
        most_missed_habit=_most_missed(habits, checkins, month, today),
        weekly_trend=_summary(habits, week, checkins).percentage - _summary(habits, previous_week, checkins).percentage,
        monthly_trend=_summary(habits, month, checkins).percentage - _summary(habits, previous_month, checkins).percentage,
        streak_milestone=_milestone(_streak(habits, today, checkins)),
        at_risk=_at_risk(habits, checkins, today),
    )


def _best_habit(habits: List[Habit], checkins: List[CheckIn], dates: List[date]) -> Optional[HabitInsight]:
    scores = [(habit, _habit_completed(habit, checkins, dates)) for habit in habits]
    if not scores:
        return None
    habit, score = max(scores, key=lambda item: item[1])
    return HabitInsight(habit_id=habit.id, name=habit.name, value=score)


def _most_missed(habits: List[Habit], checkins: List[CheckIn], dates: List[date], today: date) -> Optional[HabitInsight]:
    scores = [(habit, _missed_count(habit, checkins, [item for item in dates if item <= today])) for habit in habits]
    if not scores:
        return None
    habit, score = max(scores, key=lambda item: item[1])
    return HabitInsight(habit_id=habit.id, name=habit.name, value=score)


def _at_risk(habits: List[Habit], checkins: List[CheckIn], today: date) -> List[HabitInsight]:
    return [
        HabitInsight(habit_id=habit.id, name=habit.name, value=1)
        for habit in habits
        if is_due_on(habit, today) and not _completed_on(habit, checkins, today)
    ][:5]


def _heatmap_day(habit: Habit, target: date, checkins: List[CheckIn], today: date) -> HeatmapDay:
    checkin = next((item for item in checkins if item.date == target), None)
    due = is_due_on(habit, target)
    return HeatmapDay(date=target, completed=bool(checkin), missed=due and not checkin and target < today, note=checkin.note if checkin else "")


def _calendar_status(habit: Habit, target: date, checkins: List[CheckIn]) -> CalendarHabitStatus:
    return CalendarHabitStatus(habit_id=habit.id, name=habit.name, due=is_due_on(habit, target), completed=_completed_on(habit, checkins, target))


def _streak(habits: List[Habit], target: date, checkins: List[CheckIn]) -> int:
    streak = 0
    current = target
    while habits and all((not is_due_on(habit, current)) or _completed_on(habit, checkins, current) for habit in habits):
        streak += 1
        current -= timedelta(days=1)
    return streak


def _habit_streak(habit: Habit, target: date, checkins: List[CheckIn]) -> int:
    streak = 0
    current = target
    while (not is_due_on(habit, current)) or _completed_on(habit, checkins, current):
        streak += 1
        current -= timedelta(days=1)
    return streak


def _longest_streak(habit: Habit, heatmap: List[HeatmapDay]) -> int:
    best = current = 0
    for item in heatmap:
        current = current + 1 if item.completed or not is_due_on(habit, item.date) else 0
        best = max(best, current)
    return best


def _habit_completed(habit: Habit, checkins: List[CheckIn], dates: List[date]) -> int:
    return sum(1 for item in checkins if item.habit_id == habit.id and item.date in dates)


def _missed_count(habit: Habit, checkins: List[CheckIn], dates: List[date]) -> int:
    return sum(1 for item in dates if is_due_on(habit, item) and not _completed_on(habit, checkins, item))


def _completed_on(habit: Habit, checkins: List[CheckIn], target: date) -> bool:
    return any(item.habit_id == habit.id and item.date == target for item in checkins)


def _has_habit(habits: List[Habit], habit_id: str) -> bool:
    return any(habit.id == habit_id for habit in habits)


def _milestone(streak: int) -> str:
    return f"{streak} day streak" if streak else "Start a streak today"


def _percentage(completed: int, total: int) -> int:
    return round((completed / total) * 100) if total else 0
