"""用户、Profile 及会话 Pydantic 模型定义。"""

from typing import Optional, List, Literal, Union
from pydantic import BaseModel, model_validator, field_validator
from datetime import datetime
import json

# 用户角色类型
UserRole = Literal["family", "volunteer", "expert", "admin", "maintainer"]


# 登录用 Pydantic 模型
class UserLogin(BaseModel):
    """用户登录请求模型。"""

    username: str
    password: str


class UserBase(BaseModel):
    """用户基础信息模型。"""

    username: Optional[str]
    email: Optional[str]
    gender: Optional[str] = "hidden"  # ['male', 'female', 'hidden']
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    roles: List[UserRole] = []  # 只接受/输出 List[str]，由 ORM 层保证为 JSON 字符串
    status: Optional[str] = "active"
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False


# --- Profile Schemas ---
class VolunteerProfileCreate(BaseModel):
    """志愿者档案创建请求模型。"""

    full_name: str
    phone: str
    public_email: Optional[str] = None
    is_public_visible: Optional[bool] = False
    skills: Optional[List[str]] = []


class ExpertProfileCreate(BaseModel):
    """专家档案创建请求模型。"""

    full_name: str
    phone: str
    public_email: Optional[str] = None
    title: Optional[str] = None
    org: Optional[str] = None
    skills: Optional[List[str]] = []


# 注册请求 schema
class UserRegisterRequest(BaseModel):
    """用户注册请求模型。"""

    username: str
    password: str
    email: Optional[str] = None
    gender: Optional[str] = "hidden"
    nickname: Optional[str] = None
    avatar: Optional[str] = None
    roles: List[UserRole]
    volunteer_info: Optional[VolunteerProfileCreate] = None
    expert_info: Optional[ExpertProfileCreate] = None

    @model_validator(mode="after")
    def check_profile_required(self):
        """校验角色对应的档案信息是否已提供。

        Returns:
            当前实例。

        Raises:
            ValueError: 当角色包含 volunteer 但未提供 volunteer_info，
                或角色包含 expert 但未提供 expert_info。
        """
        errors = []
        if "volunteer" in self.roles and not self.volunteer_info:
            errors.append("volunteer_info is required when role includes 'volunteer'")
        if "expert" in self.roles and not self.expert_info:
            errors.append("expert_info is required when role includes 'expert'")
        if errors:
            raise ValueError(", ".join(errors))
        return self


# 输出 profile schema
class VolunteerProfileOut(VolunteerProfileCreate):
    """志愿者档案输出模型。"""

    user_id: int
    service_hours: Optional[str] = "0"
    status: Optional[str] = "pending"
    work_status: Optional[str] = "offline"

    class Config:
        """Pydantic 配置：启用 ORM 模式。"""
        from_attributes = True


class ExpertProfileOut(ExpertProfileCreate):
    """专家档案输出模型。"""

    user_id: int
    status: Optional[str] = "pending"

    class Config:
        """Pydantic 配置：启用 ORM 模式。"""
        from_attributes = True


class UserOut(UserBase):
    """用户输出模型。"""

    id: int
    volunteer_profile: Optional[VolunteerProfileOut] = None
    expert_profile: Optional[ExpertProfileOut] = None

    class Config:
        """Pydantic 配置：启用 ORM 模式。"""
        from_attributes = True

    @field_validator("roles", mode="before")
    @classmethod
    def parse_roles(cls, v):
        """只做 json.loads，保证 roles 为 List[str]"""
        if isinstance(v, str):
            return json.loads(v)
        return v


# Session Pydantic 模型
class SessionBase(BaseModel):
    """会话基础模型。"""

    session_id: str
    user_id: int
    created_at: datetime
    expired_at: Optional[datetime] = None
    user_agent: Optional[str] = None
    ip: Optional[str] = None


class SessionCreate(BaseModel):
    """会话创建请求模型。"""

    user_id: int
    expired_at: Optional[datetime] = None
    user_agent: Optional[str] = None
    ip: Optional[str] = None


class SessionOut(SessionBase):
    """会话输出模型。"""

    class Config:
        """Pydantic 配置：启用 ORM 模式。"""
        from_attributes = True


class UserUpdate(BaseModel):
    """用户更新请求模型。"""

    username: Optional[str] = None
    email: Optional[str] = None
    gender: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class Token(BaseModel):
    """JWT 令牌模型。"""

    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """令牌解码数据模型。"""

    username: Optional[str] = None
    user_id: Optional[int] = None
