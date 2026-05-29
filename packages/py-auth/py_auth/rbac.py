"""基于角色的访问控制（RBAC）模块。"""

import json
from collections.abc import Callable
from functools import wraps
from typing import Any

from fastapi import HTTPException, status


def has_role(user: Any, role: str) -> bool:
    """判断用户是否拥有指定角色。"""
    roles = getattr(user, "roles", [])
    if isinstance(roles, str):
        try:
            roles = json.loads(roles)
        except json.JSONDecodeError:
            roles = []
    return isinstance(roles, list) and role in roles


def require_role(*required_roles: str) -> Callable:
    """角色校验装饰器工厂，校验 current_user.roles 是否包含所需角色。"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: object, **kwargs: object) -> Any:
            current_user = kwargs.get("current_user")
            if not current_user:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未认证")
            user_roles = getattr(current_user, "roles", [])
            if isinstance(user_roles, str):
                try:
                    user_roles = json.loads(user_roles)
                except json.JSONDecodeError:
                    user_roles = []
            if not isinstance(user_roles, list) or not set(user_roles) & set(required_roles):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"权限不足：需要 {list(required_roles)}，当前 {user_roles}",
                )
            return await func(*args, **kwargs)
        return wrapper
    return decorator
