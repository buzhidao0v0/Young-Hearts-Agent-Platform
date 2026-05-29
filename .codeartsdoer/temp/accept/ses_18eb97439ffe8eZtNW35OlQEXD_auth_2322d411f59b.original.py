from datetime import datetime
from typing import Optional

from py_schemas.base import BaseSchema


class LoginRequest(BaseSchema):
    username: str
    password: str


class TokenResponse(BaseSchema):
    access_token: str
    token_type: str = "bearer"


class UserInfo(BaseSchema):
    id: int
    username: str
    email: Optional[str] = None
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    roles: list[str] = []
    status: str = "active"
    is_active: bool = True
