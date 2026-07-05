import json
from datetime import date, datetime, timezone
from threading import Lock
from typing import Any, Dict, List
from uuid import uuid4

from app.core.config import DATA_DIR, DATA_FILE
from app.models import CheckIn, Habit, HabitCreate


class HabitStore:
    def __init__(self) -> None:
        self._lock = Lock()
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not DATA_FILE.exists():
            self._write({"habits": [], "checkins": []})

    def list_habits(self, active_only: bool = True) -> List[Habit]:
        data = self._read()
        habits = [Habit(**habit) for habit in data["habits"]]
        if active_only:
            return [habit for habit in habits if habit.active]
        return habits

    def create_habit(self, payload: HabitCreate) -> Habit:
        habit = Habit(
            id=str(uuid4()),
            name=payload.name.strip(),
            category=payload.category.strip() or "Personal",
            color=payload.color,
            created_at=datetime.now(timezone.utc),
        )
        with self._lock:
            data = self._read()
            data["habits"].append(habit.model_dump(mode="json"))
            self._write(data)
        return habit

    def deactivate_habit(self, habit_id: str) -> bool:
        with self._lock:
            data = self._read()
            changed = False
            for habit in data["habits"]:
                if habit["id"] == habit_id and habit.get("active", True):
                    habit["active"] = False
                    changed = True
            if changed:
                self._write(data)
            return changed

    def list_checkins(self, target_date: date) -> List[CheckIn]:
        data = self._read()
        return [
            CheckIn(**checkin)
            for checkin in data["checkins"]
            if checkin["date"] == target_date.isoformat()
        ]

    def add_checkin(self, habit_id: str, target_date: date) -> CheckIn:
        active_ids = {habit.id for habit in self.list_habits(active_only=True)}
        if habit_id not in active_ids:
            raise ValueError("Habit does not exist")

        with self._lock:
            data = self._read()
            for checkin in data["checkins"]:
                if checkin["habit_id"] == habit_id and checkin["date"] == target_date.isoformat():
                    return CheckIn(**checkin)

            checkin = CheckIn(
                habit_id=habit_id,
                date=target_date,
                completed_at=datetime.now(timezone.utc),
            )
            data["checkins"].append(checkin.model_dump(mode="json"))
            self._write(data)
            return checkin

    def remove_checkin(self, habit_id: str, target_date: date) -> bool:
        with self._lock:
            data = self._read()
            original_count = len(data["checkins"])
            data["checkins"] = [
                checkin
                for checkin in data["checkins"]
                if not (
                    checkin["habit_id"] == habit_id
                    and checkin["date"] == target_date.isoformat()
                )
            ]
            changed = len(data["checkins"]) != original_count
            if changed:
                self._write(data)
            return changed

    def all_checkins(self) -> List[CheckIn]:
        return [CheckIn(**checkin) for checkin in self._read()["checkins"]]

    def _read(self) -> Dict[str, List[Dict[str, Any]]]:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            return json.load(file)

    def _write(self, data: Dict[str, List[Dict[str, Any]]]) -> None:
        with DATA_FILE.open("w", encoding="utf-8") as file:
            json.dump(data, file, indent=2)
            file.write("\n")


store = HabitStore()
