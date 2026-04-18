import os
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from app.db import get_session
from app.models import SessionToken, User

security = HTTPBearer(auto_error=False)


def _legacy_admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", "admin")


def get_current_user(
    session: Session = Depends(get_session),
    creds: HTTPAuthorizationCredentials | None = Depends(security),
) -> User:
    if not creds or not creds.credentials or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = creds.credentials.strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # Backward compatibility: allow ADMIN_PASSWORD as sysadmin token.
    if token == _legacy_admin_password():
        return User(id=-1, email="legacy-admin", password_hash="", role="sysadmin", tenant_id=None)

    row = session.exec(select(SessionToken).where(SessionToken.token == token)).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if row.expires_at is not None:
        now = datetime.now(timezone.utc)
        if row.expires_at <= now:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")

    user = session.get(User, row.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user


def require_sysadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != "sysadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    # admin = sysadmin or tenant admin
    if user.role not in ("sysadmin", "tenant"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
    return user


def require_campaign_manager(user: User = Depends(get_current_user)) -> User:
    # campaign manager = sysadmin or tenant admin or tenant user
    if user.role not in ("sysadmin", "tenant", "user"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
    return user

