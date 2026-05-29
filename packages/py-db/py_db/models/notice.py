"""通知与通知接收人 ORM 模型定义。"""

from sqlalchemy import Column, BigInteger, String, Text, DateTime, JSON, ForeignKeyConstraint
from sqlalchemy.sql import func
from py_db.session import Base


class Notice(Base):
    """通知表 ORM 模型，对应 notices 表。"""

    __tablename__ = "notices"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tenant_id = Column(BigInteger, nullable=False)
    title = Column(String(512), nullable=False)
    content = Column(Text)
    notice_type = Column(String(64), default="general")
    status = Column(String(32), default="draft")
    published_at = Column(DateTime(timezone=False))
    created_by = Column(BigInteger)
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())


class NoticeRecipient(Base):
    """通知接收人表 ORM 模型，对应 notice_recipients 表。"""

    __tablename__ = "notice_recipients"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    notice_id = Column(BigInteger, nullable=False)
    user_id = Column(BigInteger, nullable=False)
    confirmed = Column(DateTime(timezone=False))
    reminded_count = Column(BigInteger, default=0)
    __table_args__ = (ForeignKeyConstraint(["notice_id"], ["notices.id"], ondelete="CASCADE"),)
