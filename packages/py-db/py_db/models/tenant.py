"""租户与租户用户角色 ORM 模型定义。"""

from sqlalchemy import Column, BigInteger, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from py_db.session import Base


class Tenant(Base):
    """租户表 ORM 模型，对应 tenants 表。"""

    __tablename__ = "tenants"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(64), nullable=False, unique=True)
    status = Column(String(32), default="active")
    config = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())


class TenantUserRole(Base):
    """租户用户角色表 ORM 模型，对应 tenant_user_roles 表。"""

    __tablename__ = "tenant_user_roles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tenant_id = Column(BigInteger, nullable=False)
    user_id = Column(BigInteger, nullable=False)
    role = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
