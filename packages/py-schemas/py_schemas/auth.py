"""认证相关 Schema 定义模块。"""

from datetime import datetime
from typing import Optional

from py_schemas.base import BaseSchema


class LoginRequest(BaseSchema):
    """登录请求模型。"""

    username: str
    password: str


class TokenResponse(BaseSchema):
    """令牌响应模型。"""

    access_token: str
    token_type: str = "bearer"


class UserInfo(BaseSchema):
    """用户信息响应模型。"""

    id: int
    username: str
    email: Optional[str] = None
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    roles: list[str] = []
    status: str = "active"
    is_active: bool = True
