from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import Session as SessionModel, User
from app.repositories.user_repository import get_user_by_id


def create_session(db: Session, session: SessionModel) -> SessionModel:
    """新增会话记录。"""
    db.add(session)
    db.commit()
    return session


def delete_by_session_id(db: Session, session_id: str) -> None:
    """按 session_id 删除会话。"""
    db.query(SessionModel).filter(SessionModel.session_id == session_id).delete()
    db.commit()


def get_by_session_id(db: Session, session_id: str) -> SessionModel | None:
    """按 session_id 查询会话。"""
    return db.query(SessionModel).filter(SessionModel.session_id == session_id).first()


def get_valid_session(db: Session, session_id: str) -> SessionModel:
    """查询并校验 session 有效性，过期或不存在时抛出 401。

    Args:
        db: 数据库会话。
        session_id: 待校验的会话标识。

    Returns:
        有效的 SessionModel 实例。

    Raises:
        HTTPException: session 不存在或已过期时抛出 401。
    """
    session = get_by_session_id(db, session_id)
    if not session:
        raise HTTPException(status_code=401, detail=f"Session 失效或不存在（session_id={session_id}）")
    expired_at = getattr(session, "expired_at", None)
    if expired_at is not None and isinstance(expired_at, datetime):
        now = datetime.now(timezone.utc)
        if expired_at.tzinfo is None:
            expired_at = expired_at.replace(tzinfo=timezone.utc)
        else:
            expired_at = expired_at.astimezone(timezone.utc)
        if expired_at < now:
            raise HTTPException(status_code=401, detail=f"Session 已过期（session_id={session_id}，expired_at={expired_at.isoformat()}，now={now.isoformat()}）")
    return session


def get_user_by_session(db: Session, session_id: str) -> User | None:
    """通过 session_id 获取关联用户（含过期校验）。"""
    try:
        session = get_valid_session(db, session_id)
    except HTTPException:
        return None
    return get_user_by_id(db, session.user_id)
