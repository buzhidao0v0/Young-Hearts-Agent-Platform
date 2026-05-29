"""用户业务：创建、查询、更新与删除。"""

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import get_user_by_username as _get_by_username, get_user_by_id as _get_by_id, create_user as _create_user, update_user as _update_user, delete_user as _delete_user


def create_user(db: Session, user_in):
    """创建用户，roles 支持多角色，兼容 UserRegisterRequest。"""
    from app.services.auth import get_password_hash
    import json
    user = User(
        username=user_in.username,
        email=getattr(user_in, "email", None),
        gender=getattr(user_in, "gender", "hidden"),
        password_hash=get_password_hash(user_in.password),
        nickname=getattr(user_in, "nickname", None),
        avatar=getattr(user_in, "avatar", None),
        roles=json.dumps(user_in.roles) if hasattr(user_in, "roles") else '[]',
        status=getattr(user_in, "status", "active"),
    )
    return _create_user(db, user)


def get_user_by_username(db: Session, username: str):
    """按用户名查询用户。"""
    return _get_by_username(db, username)


def get_user_by_id(db: Session, user_id: int):
    """按 ID 查询用户。"""
    return _get_by_id(db, user_id)


def update_user(db: Session, user: User, data: dict):
    """更新用户字段。"""
    return _update_user(db, user, data)


def delete_user(db: Session, user: User):
    """删除用户记录。"""
    _delete_user(db, user)
