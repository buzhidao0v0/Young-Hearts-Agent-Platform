import json
from functools import wraps
from typing import Any, Callable

from fastapi import HTTPException, status


def has_role(user: Any, role: str) -> bool:
    roles = getattr(user, "roles", [])
    if isinstance(roles, str):
        try:
            roles = json.loads(roles)
        except json.JSONDecodeError:
            roles = []
    return isinstance(roles, list) and role in roles


def require_role(*required_roles: str) -> Callable:
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
