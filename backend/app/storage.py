import json
import secrets
from datetime import date, datetime, timedelta, timezone
from threading import Lock
from typing import Any, Dict, List, Optional
from uuid import uuid4

from app.core.config import DATA_DIR, DATA_FILE, RESET_TOKEN_EXPIRES_MINUTES
from app.models import CheckIn, Habit, HabitCreate, User, UserCreate


class HabitStore:
    def __init__(self) -> None:
        self._lock = Lock()
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not DATA_FILE.exists():
            self._write(self._empty_data())
        else:
            self._write(self._read())

    def create_user(self, payload: UserCreate, password_hash: str) -> User:
        email = payload.email.strip().lower()
        if self.get_user_by_email(email) is not None:
            raise ValueError("Email is already registered")

        user = User(
            id=str(uuid4()),
            name=payload.name.strip(),
            email=email,
            password_hash=password_hash,
            created_at=datetime.now(timezone.utc),
        )
        with self._lock:
            data = self._read()
            data["users"].append(user.model_dump(mode="json"))
            self._write(data)
        return user

    def get_user_by_email(self, email: str) -> Optional[User]:
        email = email.strip().lower()
        for user in self._read()["users"]:
            if user["email"] == email:
                return User(**user)
        return None

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        for user in self._read()["users"]:
            if user["id"] == user_id:
                return User(**user)
        return None

    def update_user_password(self, user_id: str, password_hash: str) -> None:
        with self._lock:
            data = self._read()
            for user in data["users"]:
                if user["id"] == user_id:
                    user["password_hash"] = password_hash
            self._write(data)

    def create_reset_token(self, email: str) -> Optional[str]:
        user = self.get_user_by_email(email)
        if user is None:
            return None

        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=RESET_TOKEN_EXPIRES_MINUTES
        )
        with self._lock:
            data = self._read()
            data["reset_tokens"] = [
                item for item in data["reset_tokens"] if item["user_id"] != user.id
            ]
            data["reset_tokens"].append(
                {
                    "token": token,
                    "user_id": user.id,
                    "expires_at": expires_at.isoformat(),
                }
            )
            self._write(data)
        return token

    def consume_reset_token(self, token: str) -> Optional[str]:
        with self._lock:
            data = self._read()
            now = datetime.now(timezone.utc)
            for item in data["reset_tokens"]:
                expires_at = datetime.fromisoformat(item["expires_at"])
                if item["token"] == token and expires_at > now:
                    data["reset_tokens"].remove(item)
                    self._write(data)
                    return str(item["user_id"])
        return None

    def list_habits(self, user_id: str, active_only: bool = True) -> List[Habit]:
        data = self._read()
        habits = [Habit(**habit) for habit in data["habits"] if habit.get("user_id") == user_id]
        if active_only:
            return [habit for habit in habits if habit.active]
        return habits

    def create_habit(self, user_id: str, payload: HabitCreate) -> Habit:
        habit = Habit(
            id=str(uuid4()),
            user_id=user_id,
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

    def deactivate_habit(self, user_id: str, habit_id: str) -> bool:
        with self._lock:
            data = self._read()
            changed = False
            for habit in data["habits"]:
                if habit["id"] == habit_id and habit["user_id"] == user_id:
                    habit["active"] = False
                    changed = True
            if changed:
                self._write(data)
            return changed

    def list_checkins(self, user_id: str, target_date: date) -> List[CheckIn]:
        return [
            CheckIn(**checkin)
            for checkin in self._read()["checkins"]
            if checkin.get("user_id") == user_id and checkin["date"] == target_date.isoformat()
        ]

    def add_checkin(self, user_id: str, habit_id: str, target_date: date) -> CheckIn:
        active_ids = {habit.id for habit in self.list_habits(user_id, active_only=True)}
        if habit_id not in active_ids:
            raise ValueError("Habit does not exist")

        with self._lock:
            data = self._read()
            for checkin in data["checkins"]:
                if (
                    checkin.get("user_id") == user_id
                    and checkin["habit_id"] == habit_id
                    and checkin["date"] == target_date.isoformat()
                ):
                    return CheckIn(**checkin)

            checkin = CheckIn(
                user_id=user_id,
                habit_id=habit_id,
                date=target_date,
                completed_at=datetime.now(timezone.utc),
            )
            data["checkins"].append(checkin.model_dump(mode="json"))
            self._write(data)
            return checkin

    def remove_checkin(self, user_id: str, habit_id: str, target_date: date) -> bool:
        with self._lock:
            data = self._read()
            original_count = len(data["checkins"])
            data["checkins"] = [
                checkin
                for checkin in data["checkins"]
                if not (
                    checkin.get("user_id") == user_id
                    and checkin["habit_id"] == habit_id
                    and checkin["date"] == target_date.isoformat()
                )
            ]
            changed = len(data["checkins"]) != original_count
            if changed:
                self._write(data)
            return changed

    def all_checkins(self, user_id: str) -> List[CheckIn]:
        return [
            CheckIn(**checkin)
            for checkin in self._read()["checkins"]
            if checkin.get("user_id") == user_id
        ]

    def _read(self) -> Dict[str, List[Dict[str, Any]]]:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return {**self._empty_data(), **data}

    def _write(self, data: Dict[str, List[Dict[str, Any]]]) -> None:
        with DATA_FILE.open("w", encoding="utf-8") as file:
            json.dump({**self._empty_data(), **data}, file, indent=2)
            file.write("\n")

    def _empty_data(self) -> Dict[str, List[Dict[str, Any]]]:
        return {"users": [], "reset_tokens": [], "habits": [], "checkins": []}

store = HabitStore()
