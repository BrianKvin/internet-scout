"""Authentication router for sign up/sign in session flow."""

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_db
from db import auth as auth_db
from schemas.auth import SignUpRequest, SignInRequest, UserOut, TokenResponse
from utils.auth_security import create_token, hash_password, verify_password, verify_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sign-up", status_code=201, response_model=TokenResponse)
async def sign_up(body: SignUpRequest, db: AsyncSession = Depends(get_db)):
    existing = await auth_db.get_user_by_email(db, body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = await auth_db.create_user(
        db,
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    await db.commit()
    token = create_token(user.id, user.email)
    return TokenResponse(
        token=token,
        user=UserOut.model_validate(user),
    )


@router.post("/sign-in", response_model=TokenResponse)
async def sign_in(body: SignInRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_db.get_user_by_email(db, body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.id, user.email)
    return TokenResponse(
        token=token,
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
async def get_me(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = await auth_db.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return UserOut.model_validate(user)
