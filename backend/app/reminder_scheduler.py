import asyncio
from datetime import datetime, timezone

from app.notification_store import due_reminders, mark_reminder_sent
from app.push_service import send_push


async def reminder_loop() -> None:
    while True:
        await send_due_reminders()
        await asyncio.sleep(60)


async def send_due_reminders() -> int:
    sent = 0
    reminders = due_reminders(datetime.now(timezone.utc).replace(second=0, microsecond=0))
    for item in reminders:
        habit = item["habit"]
        success = send_push(
            item["subscription"],
            f"Time for {habit.name}",
            "Your future self is waiting for this check-in.",
        )
        if success:
            mark_reminder_sent(item["user"].id, habit.id, item["date"])
            sent += 1
    return sent
