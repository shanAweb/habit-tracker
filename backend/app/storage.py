import json
import secrets
from datetime import date, datetime, timedelta, timezone
from threading import Lock
from typing import Any, Dict, List, Optional
from uuid import uuid4

from app.core.config import DATA_DIR, DATA_FILE, RESET_TOKEN_EXPIRES_MINUTES
from app.models import CheckIn, Habit, HabitCreate, HabitUpdate, ProfileUpdate, User, UserCreate


class HabitStore:
    def __init__(self) -> None:
        self._lock = Lock()
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        self._write(self._read() if DATA_FILE.exists() else self._empty_data())

    def create_user(self, payload: UserCreate, password_hash: str) -> User:
        email = payload.email.strip().lower()
        if self.get_user_by_email(email):
            raise ValueError("Email is already registered")
        user = User(
            id=str(uuid4()), name=payload.name.strip(), email=email,
            password_hash=password_hash, created_at=datetime.now(timezone.utc),
        )
        return User(**self._append("users", user.model_dump(mode="json")))

    def update_user(self, user_id: str, payload: ProfileUpdate) -> User:
        email = payload.email.strip().lower()
        other = self.get_user_by_email(email)
        if other and other.id != user_id:
            raise ValueError("Email is already registered")
        with self._lock:
            data = self._read()
            for user in data["users"]:
                if user["id"] == user_id:
                    user.update(payload.model_dump())
                    user["email"] = email
                    self._write(data)
                    return User(**user)
        raise ValueError("User not found")

    def delete_user(self, user_id: str) -> None:
        with self._lock:
            data = self._read()
            data["users"] = [item for item in data["users"] if item["id"] != user_id]
            data["habits"] = [item for item in data["habits"] if item.get("user_id") != user_id]
            data["checkins"] = [item for item in data["checkins"] if item.get("user_id") != user_id]
            data["reset_tokens"] = [item for item in data["reset_tokens"] if item["user_id"] != user_id]
            self._write(data)

    def get_user_by_email(self, email: str) -> Optional[User]:
        email = email.strip().lower()
        return self._first_user(lambda user: user["email"] == email)

    def get_user_by_id(self, user_id: str) -> Optional[User]:
        return self._first_user(lambda user: user["id"] == user_id)

    def update_user_password(self, user_id: str, password_hash: str) -> None:
        with self._lock:
            data = self._read()
            for user in data["users"]:
                if user["id"] == user_id:
                    user["password_hash"] = password_hash
            self._write(data)

    def create_reset_token(self, email: str) -> Optional[str]:
        user = self.get_user_by_email(email)
        if not user:
            return None
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRES_MINUTES)
        with self._lock:
            data = self._read()
            data["reset_tokens"] = [item for item in data["reset_tokens"] if item["user_id"] != user.id]
            data["reset_tokens"].append({"token": token, "user_id": user.id, "expires_at": expires_at.isoformat()})
            self._write(data)
        return token

    def consume_reset_token(self, token: str) -> Optional[str]:
        with self._lock:
            data = self._read()
            now = datetime.now(timezone.utc)
            for item in list(data["reset_tokens"]):
                if item["token"] == token and datetime.fromisoformat(item["expires_at"]) > now:
                    data["reset_tokens"].remove(item)
                    self._write(data)
                    return str(item["user_id"])
        return None

    def list_habits(self, user_id: str, active_only: bool = True) -> List[Habit]:
        habits = [Habit(**item) for item in self._read()["habits"] if item.get("user_id") == user_id]
        return [habit for habit in habits if habit.active] if active_only else habits

    def get_habit(self, user_id: str, habit_id: str) -> Optional[Habit]:
        for habit in self.list_habits(user_id, active_only=False):
            if habit.id == habit_id:
                return habit
        return None

    def create_habit(self, user_id: str, payload: HabitCreate) -> Habit:
        habit = Habit(
            id=str(uuid4()), user_id=user_id, name=payload.name.strip(),
            category=payload.category.strip() or "Personal", color=payload.color,
            created_at=datetime.now(timezone.utc), **self._habit_options(payload),
        )
        return Habit(**self._append("habits", habit.model_dump(mode="json")))

    def update_habit(self, user_id: str, habit_id: str, payload: HabitUpdate) -> Habit:
        with self._lock:
            data = self._read()
            for habit in data["habits"]:
                if habit["id"] == habit_id and habit.get("user_id") == user_id:
                    habit.update(payload.model_dump())
                    habit["name"] = payload.name.strip()
                    habit["category"] = payload.category.strip() or "Personal"
                    self._write(data)
                    return Habit(**habit)
        raise ValueError("Habit not found")

    def deactivate_habit(self, user_id: str, habit_id: str) -> bool:
        with self._lock:
            data = self._read()
            changed = False
            for habit in data["habits"]:
                if habit["id"] == habit_id and habit.get("user_id") == user_id:
                    habit["active"] = False
                    changed = True
            self._write(data)
            return changed

    def list_checkins(self, user_id: str, target_date: date) -> List[CheckIn]:
        return [CheckIn(**item) for item in self._read()["checkins"] if item.get("user_id") == user_id and item["date"] == target_date.isoformat()]

    def add_checkin(self, user_id: str, habit_id: str, target_date: date, note: str = "") -> CheckIn:
        if habit_id not in {habit.id for habit in self.list_habits(user_id)}:
            raise ValueError("Habit does not exist")
        with self._lock:
            data = self._read()
            for item in data["checkins"]:
                if item.get("user_id") == user_id and item["habit_id"] == habit_id and item["date"] == target_date.isoformat():
                    item["note"] = note
                    self._write(data)
                    return CheckIn(**item)
            item = CheckIn(user_id=user_id, habit_id=habit_id, date=target_date, note=note, completed_at=datetime.now(timezone.utc))
            data["checkins"].append(item.model_dump(mode="json"))
            self._write(data)
            return item

    def remove_checkin(self, user_id: str, habit_id: str, target_date: date) -> bool:
        with self._lock:
            data = self._read()
            before = len(data["checkins"])
            data["checkins"] = [item for item in data["checkins"] if not (item.get("user_id") == user_id and item["habit_id"] == habit_id and item["date"] == target_date.isoformat())]
            self._write(data)
            return before != len(data["checkins"])

    def all_checkins(self, user_id: str) -> List[CheckIn]:
        return [CheckIn(**item) for item in self._read()["checkins"] if item.get("user_id") == user_id]

    def _append(self, key: str, item: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            data = self._read()
            data[key].append(item)
            self._write(data)
        return item

    def _first_user(self, predicate: Any) -> Optional[User]:
        for user in self._read()["users"]:
            if predicate(user):
                return User(**user)
        return None

    def _read(self) -> Dict[str, List[Dict[str, Any]]]:
        with DATA_FILE.open("r", encoding="utf-8") as file:
            return {**self._empty_data(), **json.load(file)}

    def _write(self, data: Dict[str, List[Dict[str, Any]]]) -> None:
        with DATA_FILE.open("w", encoding="utf-8") as file:
            json.dump({**self._empty_data(), **data}, file, indent=2)
            file.write("\n")

    def _empty_data(self) -> Dict[str, List[Dict[str, Any]]]:
        return {"users": [], "reset_tokens": [], "habits": [], "checkins": []}

    def _habit_options(self, payload: HabitCreate) -> Dict[str, Any]:
        return payload.model_dump(exclude={"name", "category", "color"})


store = HabitStore()
