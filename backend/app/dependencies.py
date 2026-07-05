from fastapi import Depends, Header, HTTPException, status

from app.models import User
from app.security import decode_access_token
from app.storage import store


def current_user(authorization: str = Header(default="")) -> User:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _auth_error()

    try:
        payload = decode_access_token(token)
    except (ValueError, TypeError):
        raise _auth_error() from None

    user = store.get_user_by_id(str(payload.get("sub", "")))
    if user is None:
        raise _auth_error()
    return user


def _auth_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"},
    )
