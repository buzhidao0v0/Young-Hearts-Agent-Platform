"""认证业务：登录、登出、注册与密码校验。"""

import secrets
from datetime import UTC, datetime, timedelta
from functools import wraps
from typing import cast

from app.core.config import settings
from app.db.session import get_db
from app.models.user import ExpertProfile, User, VolunteerProfile
from app.models.user import Session as SessionModel
from app.repositories.session_repository import create_session, delete_by_session_id, get_valid_session
from app.repositories.user_repository import (
    create_user_with_profiles,
)
from app.repositories.user_repository import (
    get_user_by_id as repo_get_user_by_id,
)
from app.repositories.user_repository import (
    get_user_by_username as repo_get_user_by_username,
)
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

# 初始化密码加密上下文，指定用 argon2 算法，自动处理过时的加密方式
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
# OAuth2 密码模式，指定 token URL（登录接口）
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """校验明文密码与哈希是否匹配。"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """对明文密码进行哈希。"""
    return pwd_context.hash(password)


def authenticate_user(db: Session, username: str, password: str):
    """验证用户凭据，返回用户或 None。"""
    user = repo_get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, cast(str, user.password_hash)):
        return None
    return user


# 权限装饰器：校验 current_user.roles
def require_roles(roles):
    """权限装饰器：校验 current_user.roles 是否包含所需角色。"""
    import json
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user or not hasattr(current_user, 'roles'):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="权限校验失败：未获取到用户信息或缺少 roles 属性",
                )
            user_roles = getattr(current_user, 'roles', [])
            if isinstance(user_roles, str):
                user_roles = json.loads(user_roles)
            if not isinstance(user_roles, list):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"权限校验失败：user.roles 类型应为 list[str]，"
                        f"实际为 {type(user_roles).__name__}，值为 {user_roles}"
                    ),
                )
            required_roles = set(roles)
            user_roles_set = set(user_roles)
            if not user_roles_set & required_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"权限不足：用户角色 {list(user_roles_set)} "
                        f"不包含所需角色 {list(required_roles)}"
                    ),
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator

async def login(db: Session, user_in, request: Request):
    """登录：验证凭据，生成 session_id 并通过 repository 写入 session 表。"""
    user = repo_get_user_by_username(db, user_in.username)
    if not user or not verify_password(user_in.password, getattr(user, "password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    user_agent = request.headers.get("user-agent", "")
    ip = request.client.host if request.client else ""
    session_id = secrets.token_urlsafe(32)
    now = datetime.now(UTC)
    expired_at = now + timedelta(minutes=getattr(settings, "SESSION_EXPIRE_MINUTES", 10080))
    session = SessionModel(
        session_id=session_id,
        user_id=user.id,
        created_at=now,
        expired_at=expired_at,
        user_agent=user_agent,
        ip=ip
    )
    create_session(db, session)
    db.refresh(user)
    from app.schemas.user import UserOut
    user_out = UserOut.model_validate(user)
    return user_out, session_id

async def logout(db: Session, request: Request):
    """登出：通过 repository 清理 session 表记录，支持 Cookie/Header。"""
    session_id = None
    if "session_id" in request.cookies:
        session_id = request.cookies["session_id"]
    elif "x-session-id" in request.headers:
        session_id = request.headers["x-session-id"]
    if session_id:
        delete_by_session_id(db, session_id)

async def register(db, user_in):
    """注册：字段与校验对齐 API 设计，通过 repository 层原子性创建。"""
    user = User(
        username=user_in.username,
        email=getattr(user_in, "email", None),
        gender=getattr(user_in, "gender", "hidden"),
        password_hash=get_password_hash(user_in.password),
        nickname=getattr(user_in, "nickname", None),
        avatar=getattr(user_in, "avatar", None),
        roles=str(user_in.roles) if user_in.roles else '[]',
        status=user_in.status or "active",
        is_active=True,
    )
    vp = None
    if "volunteer" in user_in.roles and user_in.volunteer_info is not None:
        v = user_in.volunteer_info
        vp = VolunteerProfile(
            full_name=getattr(v, "full_name", None),
            phone=getattr(v, "phone", None),
            public_email=getattr(v, "public_email", None),
            is_public_visible=getattr(v, "is_public_visible", False),
            skills=str(getattr(v, "skills", []) or []),
            status="pending",
            work_status="offline",
        )
    ep = None
    if "expert" in user_in.roles and user_in.expert_info is not None:
        e = user_in.expert_info
        ep = ExpertProfile(
            full_name=getattr(e, "full_name", None),
            phone=getattr(e, "phone", None),
            public_email=getattr(e, "public_email", None),
            title=getattr(e, "title", None),
            org=getattr(e, "org", None),
            skills=str(getattr(e, "skills", []) or []),
            status="pending",
        )
    return create_user_with_profiles(db, user, vp, ep)

def get_current_user_from_context(request: Request, db: Session = Depends(get_db)):
    """自动识别 Cookie/Header，查 session 表，注入 user。"""
    session_id = None
    if settings.SESSION_COOKIE_NAME in request.cookies:
        session_id = request.cookies[settings.SESSION_COOKIE_NAME]
    elif request.headers.get("X-Session-ID"):
        session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=401, detail="SessionID required（未在 Cookie 或 Header 中找到 session_id）")
    session = get_valid_session(db, session_id)
    user = repo_get_user_by_id(db, session.user_id)
    if not user:
        raise HTTPException(
            status_code=401,
            detail=(
                f"Session 关联用户不存在"
                f"（user_id={session.user_id}，session_id={session_id}）"
            ),
        )
    if hasattr(user, "status") and getattr(user, "status", None) == "banned":
        raise HTTPException(status_code=403, detail=f"用户已被禁用（user_id={user.id}，username={user.username}）")
    return user
