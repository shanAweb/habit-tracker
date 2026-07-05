import json
from typing import Any, Dict

from pywebpush import WebPushException, webpush

from app.core.config import VAPID_PRIVATE_KEY, VAPID_PRIVATE_KEY_FILE, VAPID_SUBJECT


def push_configured() -> bool:
    return bool(_private_key() and VAPID_SUBJECT)


def send_push(subscription: Dict[str, Any], title: str, body: str, url: str = "/check-in") -> bool:
    if not push_configured():
        return False
    try:
        webpush(
            subscription_info={
                "endpoint": subscription["endpoint"],
                "keys": subscription["keys"],
            },
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=_private_key(),
            vapid_claims={"sub": VAPID_SUBJECT},
        )
        return True
    except WebPushException:
        return False


def _private_key() -> str:
    if VAPID_PRIVATE_KEY_FILE:
        return VAPID_PRIVATE_KEY_FILE
    return VAPID_PRIVATE_KEY.replace("\\n", "\n")
