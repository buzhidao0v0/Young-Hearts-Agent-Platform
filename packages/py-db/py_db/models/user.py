"""用户、志愿者、专家及会话 ORM 模型定义。"""

from sqlalchemy import JSON, BigInteger, Boolean, Column, DateTime, ForeignKeyConstraint, String
from sqlalchemy.sql import func

from py_db.session import Base


class User(Base):
    """用户主表 ORM 模型，对应 users 表。"""

    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(150), nullable=False, unique=True)
    email = Column(String(320), unique=True)
    gender = Column(String(16), default="hidden")
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(255))
    avatar = Column(String(512))
    roles = Column(JSON, nullable=False, default=list, comment="用户角色 JSON 数组")
    status = Column(String(32), default="active")
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())


class VolunteerProfile(Base):
    """志愿者扩展表 ORM 模型，对应 volunteer_profiles 表。"""

    __tablename__ = "volunteer_profiles"

    user_id = Column(BigInteger, primary_key=True, nullable=False)
    __table_args__ = (ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),)
    full_name = Column(String(255))
    phone = Column(String(32))
    public_email = Column(String(320))
    is_public_visible = Column(Boolean, default=False)
    service_hours = Column(String(32), default="0")
    skills = Column(String(255), default="[]")
    status = Column(String(32), default="pending")
    work_status = Column(String(32), default="offline")


class ExpertProfile(Base):
    """专家扩展表 ORM 模型，对应 expert_profiles 表。"""

    __tablename__ = "expert_profiles"

    user_id = Column(BigInteger, primary_key=True, nullable=False)
    __table_args__ = (ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),)
    full_name = Column(String(255))
    phone = Column(String(32))
    public_email = Column(String(320))
    title = Column(String(255))
    org = Column(String(255))
    skills = Column(String(255), default="[]")
    status = Column(String(32), default="pending")


class Session(Base):
    """会话表 ORM 模型，对应 sessions 表。"""

    __tablename__ = "sessions"

    session_id = Column(String(128), primary_key=True)
    user_id = Column(BigInteger)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    expired_at = Column(DateTime(timezone=False))
    user_agent = Column(String(255))
    ip = Column(String(64))
