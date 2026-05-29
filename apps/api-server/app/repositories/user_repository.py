from sqlalchemy.orm import Session

from app.models.user import User, Session as SessionModel


def get_user_by_username(db: Session, username: str) -> User | None:
    """按用户名查询用户。"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """按 ID 查询用户。"""
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user: User) -> User:
    """新增用户记录。"""
    db.add(user)
    db.flush()
    return user


def update_user(db: Session, user: User, data: dict) -> User:
    """更新用户字段。"""
    for field, value in data.items():
        if hasattr(user, field) and value is not None:
            setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    """删除用户记录。"""
    db.delete(user)
    db.commit()
