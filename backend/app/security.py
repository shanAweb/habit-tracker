import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from app.core.config import JWT_EXPIRES_MINUTES, JWT_SECRET

ALGORITHM = "HS256"
HASH_ITERATIONS = 180_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        HASH_ITERATIONS,
    ).hex()
    return f"pbkdf2_sha256${HASH_ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        _, iterations, salt, expected = stored_hash.split("$", 3)
    except ValueError:
        return False

    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations),
    ).hex()
    return hmac.compare_digest(digest, expected)


def create_access_token(user_id: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRES_MINUTES)
    return _encode_jwt({"sub": user_id, "exp": int(expires_at.timestamp())})


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        header_part, payload_part, signature_part = token.split(".")
        message = f"{header_part}.{payload_part}".encode("utf-8")
        expected = _sign(message)
        if not hmac.compare_digest(signature_part, expected):
            raise ValueError("Invalid token signature")

        payload = json.loads(_b64decode(payload_part))
    except Exception as exc:
        raise ValueError("Invalid token") from exc

    if payload.get("exp", 0) < int(datetime.now(timezone.utc).timestamp()):
        raise ValueError("Token has expired")
    return payload


def _encode_jwt(payload: Dict[str, Any]) -> str:
    header = {"alg": ALGORITHM, "typ": "JWT"}
    header_part = _b64encode(json.dumps(header, separators=(",", ":")).encode())
    payload_part = _b64encode(json.dumps(payload, separators=(",", ":")).encode())
    signature = _sign(f"{header_part}.{payload_part}".encode("utf-8"))
    return f"{header_part}.{payload_part}.{signature}"


def _sign(message: bytes) -> str:
    digest = hmac.new(JWT_SECRET.encode("utf-8"), message, hashlib.sha256).digest()
    return _b64encode(digest)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("utf-8")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)
