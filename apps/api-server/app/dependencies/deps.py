"""FastAPI 依赖注入：当前用户与角色校验。"""

import json
from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.repositories.session_repository import get_by_session_id
from app.repositories.user_repository import get_user_by_id
from app.core.config import settings


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """从 Cookie/Header 提取 session_id 并验证，返回当前用户。"""
    session_id = None
    source = None
    if settings.SESSION_COOKIE_NAME in request.cookies:
        session_id = request.cookies[settings.SESSION_COOKIE_NAME]
        source = "cookie"
    elif request.headers.get("X-Session-ID"):
        session_id = request.headers.get("X-Session-ID")
        source = "header"
    if not session_id:
        raise HTTPException(status_code=401, detail="未认证：缺少 session_id")
    session = get_by_session_id(db, session_id)
    if not session:
        raise HTTPException(status_code=401, detail=f"Session 失效（来源={source}）")
    expired_at = getattr(session, "expired_at", None)
    if expired_at is not None and isinstance(expired_at, datetime):
        now = datetime.now(timezone.utc)
        if expired_at.tzinfo is None:
            expired_at = expired_at.replace(tzinfo=timezone.utc)
        if expired_at < now:
            raise HTTPException(status_code=401, detail="Session 已过期")
    user = get_user_by_id(db, session.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Session 关联用户不存在")
    if hasattr(user, "status") and getattr(user, "status", None) == "banned":
        raise HTTPException(status_code=403, detail="用户已被禁用")
    return user


def require_roles(*roles: str):
    """角色校验依赖工厂，返回 FastAPI 依赖。"""
    def _check(current_user: User = Depends(get_current_user)) -> User:
        user_roles = getattr(current_user, "roles", [])
        if isinstance(user_roles, str):
            try:
                user_roles = json.loads(user_roles)
            except json.JSONDecodeError:
                user_roles = []
        if not isinstance(user_roles, list) or not set(user_roles) & set(roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足：需要 {list(roles)}，当前 {user_roles}",
            )
        return current_user
    return _check
