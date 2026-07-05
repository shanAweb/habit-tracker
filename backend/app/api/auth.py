from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import current_user
from app.models import (
    AuthResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    PasswordChange,
    ProfileUpdate,
    ResetPasswordRequest,
    User,
    UserCreate,
    UserLogin,
    UserPublic,
)
from app.security import create_access_token, hash_password, verify_password
from app.storage import store

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate) -> AuthResponse:
    try:
        user = store.create_user(payload, hash_password(payload.password))
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return _auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin) -> AuthResponse:
    user = store.get_user_by_email(payload.email)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _auth_response(user)


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(current_user)) -> UserPublic:
    return UserPublic(**user.model_dump())


@router.put("/me", response_model=UserPublic)
def update_me(payload: ProfileUpdate, user: User = Depends(current_user)) -> UserPublic:
    try:
        updated = store.update_user(user.id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return UserPublic(**updated.model_dump())


@router.put("/password")
def change_password(payload: PasswordChange, user: User = Depends(current_user)) -> dict:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    store.update_user_password(user.id, hash_password(payload.new_password))
    return {"message": "Password changed successfully"}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(user: User = Depends(current_user)) -> None:
    store.delete_user(user.id)


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest) -> ForgotPasswordResponse:
    token = store.create_reset_token(payload.email)
    return ForgotPasswordResponse(
        message="If that email exists, a reset token has been created.",
        reset_token=token,
    )


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest) -> dict:
    user_id = store.consume_reset_token(payload.token)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    store.update_user_password(user_id, hash_password(payload.password))
    return {"message": "Password reset successfully"}


def _auth_response(user: User) -> AuthResponse:
    return AuthResponse(
        access_token=create_access_token(user.id),
        user=UserPublic(**user.model_dump()),
    )
