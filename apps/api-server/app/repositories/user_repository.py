"""用户数据访问层：CRUD 与 Profile 关联创建。"""

from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User, Session as SessionModel, VolunteerProfile, ExpertProfile


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


def create_user_with_profiles(
    db: Session,
    user: User,
    volunteer_profile: Optional[VolunteerProfile] = None,
    expert_profile: Optional[ExpertProfile] = None,
) -> User:
    """原子性创建用户及其关联 Profile。

    Args:
        db: 数据库会话。
        user: 待创建的 User ORM 实例。
        volunteer_profile: 可选的 VolunteerProfile 实例，user_id 将自动设置。
        expert_profile: 可选的 ExpertProfile 实例，user_id 将自动设置。

    Returns:
        刷新后的 User 实例，含生成的 id 及关联 profile。
    """
    db.add(user)
    db.flush()
    if volunteer_profile is not None:
        volunteer_profile.user_id = user.id
        db.add(volunteer_profile)
    if expert_profile is not None:
        expert_profile.user_id = user.id
        db.add(expert_profile)
    db.commit()
    db.refresh(user)
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
