from fastapi import APIRouter, Depends, HTTPException

from app.core.config import VAPID_PUBLIC_KEY
from app.dependencies import current_user
from app.models import User
from app.notification_models import PushMessage, PushSubscriptionCreate, PushSubscriptionDelete
from app.notification_store import delete_subscription, save_subscription, user_subscriptions
from app.push_service import push_configured, send_push

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/public-key")
def public_key() -> dict:
    return {"public_key": VAPID_PUBLIC_KEY, "configured": push_configured()}


@router.post("/subscribe")
def subscribe(payload: PushSubscriptionCreate, user: User = Depends(current_user)) -> dict:
    save_subscription(user.id, payload)
    return {"message": "Subscribed"}


@router.post("/unsubscribe")
def unsubscribe(payload: PushSubscriptionDelete, user: User = Depends(current_user)) -> dict:
    delete_subscription(user.id, payload.endpoint)
    return {"message": "Unsubscribed"}


@router.post("/test")
def test_push(payload: PushMessage, user: User = Depends(current_user)) -> dict:
    subscriptions = user_subscriptions(user.id)
    if not subscriptions:
        raise HTTPException(status_code=404, detail="No push subscription found")
    sent = sum(
        1 for subscription in subscriptions
        if send_push(subscription, payload.title, payload.body, payload.url)
    )
    return {"sent": sent}
