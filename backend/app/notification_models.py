from typing import Dict, Optional

from pydantic import BaseModel


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    expirationTime: Optional[int] = None
    keys: Dict[str, str]


class PushSubscriptionDelete(BaseModel):
    endpoint: str


class PushMessage(BaseModel):
    title: str
    body: str
    url: str = "/check-in"
