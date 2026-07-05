import json
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Dict, List
from uuid import uuid4
from zoneinfo import ZoneInfo

from app.core.config import DATA_FILE
from app.models import Habit, User
from app.notification_models import PushSubscriptionCreate
from app.schedule import is_due_on

_lock = Lock()


def save_subscription(user_id: str, payload: PushSubscriptionCreate) -> dict:
    with _lock:
        data = _read()
        data["push_subscriptions"] = [
            item for item in data["push_subscriptions"]
            if not (item["user_id"] == user_id and item["endpoint"] == payload.endpoint)
        ]
        item = {"id": str(uuid4()), "user_id": user_id, **payload.model_dump()}
        data["push_subscriptions"].append(item)
        _write(data)
        return item


def delete_subscription(user_id: str, endpoint: str) -> None:
    with _lock:
        data = _read()
        data["push_subscriptions"] = [
            item for item in data["push_subscriptions"]
            if not (item["user_id"] == user_id and item["endpoint"] == endpoint)
        ]
        _write(data)


def user_subscriptions(user_id: str) -> List[dict]:
    return [item for item in _read()["push_subscriptions"] if item["user_id"] == user_id]


def due_reminders(now: datetime) -> List[dict]:
    data = _read()
    reminders = []
    for user_data in data["users"]:
        user = User(**user_data)
        local_now = _local_now(now, user.timezone)
        for habit_data in data["habits"]:
            habit = Habit(**habit_data)
            if not _should_send(data, user, habit, local_now):
                continue
            for subscription in _subscriptions(data, user.id):
                reminders.append({
                    "user": user,
                    "habit": habit,
                    "subscription": subscription,
                    "date": local_now.date().isoformat(),
                })
    return reminders


def mark_reminder_sent(user_id: str, habit_id: str, date_key: str) -> None:
    with _lock:
        data = _read()
        _mark_sent(data, user_id, habit_id, date_key)
        _write(data)


def _should_send(data: Dict[str, Any], user: User, habit: Habit, local_now: datetime) -> bool:
    if habit.user_id != user.id or not habit.active or not habit.reminder_enabled:
        return False
    if not habit.reminder_time or habit.reminder_time != local_now.strftime("%H:%M"):
        return False
    if not is_due_on(habit, local_now.date()):
        return False
    key = _delivery_key(user.id, habit.id, local_now.date().isoformat())
    return key not in {item["key"] for item in data["notification_deliveries"]}


def _mark_sent(data: Dict[str, Any], user_id: str, habit_id: str, date_key: str) -> None:
    data["notification_deliveries"].append({
        "key": _delivery_key(user_id, habit_id, date_key),
        "user_id": user_id,
        "habit_id": habit_id,
        "date": date_key,
    })


def _delivery_key(user_id: str, habit_id: str, date_key: str) -> str:
    return f"{user_id}:{habit_id}:{date_key}"


def _subscriptions(data: Dict[str, Any], user_id: str) -> List[dict]:
    return [item for item in data["push_subscriptions"] if item["user_id"] == user_id]


def _local_now(now: datetime, timezone_name: str) -> datetime:
    try:
        return now.astimezone(ZoneInfo(timezone_name))
    except Exception:
        return now.astimezone(timezone.utc)


def _read() -> Dict[str, List[Dict[str, Any]]]:
    with DATA_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)
    return {**_empty_data(), **data}


def _write(data: Dict[str, List[Dict[str, Any]]]) -> None:
    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump({**_empty_data(), **data}, file, indent=2)
        file.write("\n")


def _empty_data() -> Dict[str, List[Dict[str, Any]]]:
    return {"users": [], "reset_tokens": [], "habits": [], "checkins": [], "push_subscriptions": [], "notification_deliveries": []}
