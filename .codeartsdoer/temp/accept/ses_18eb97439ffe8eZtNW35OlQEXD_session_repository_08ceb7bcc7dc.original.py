from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.user import Session as SessionModel, User


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


def get_user_by_session(db: Session, session_id: str) -> User | None:
    """通过 session_id 获取关联用户。"""
    session = get_by_session_id(db, session_id)
    if not session:
        return None
    expired_at = session.expired_at
    if expired_at is not None and isinstance(expired_at, datetime):
        now = datetime.now(timezone.utc)
        if expired_at.tzinfo is None:
            expired_at = expired_at.replace(tzinfo=timezone.utc)
        if expired_at < now:
            return None
    return db.query(User).filter(User.id == session.user_id).first()
