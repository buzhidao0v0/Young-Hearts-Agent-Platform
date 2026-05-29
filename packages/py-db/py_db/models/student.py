"""学生 ORM 模型定义。"""

from sqlalchemy import BigInteger, Column, DateTime, String
from sqlalchemy.sql import func

from py_db.session import Base


class Student(Base):
    """学生表 ORM 模型，对应 students 表。"""

    __tablename__ = "students"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tenant_id = Column(BigInteger, nullable=False)
    name = Column(String(255))
    phone = Column(String(32))
    wx_id = Column(String(128))
    student_no = Column(String(64))
    status = Column(String(32), default="active")
    created_at = Column(DateTime(timezone=False), server_default=func.now())
    updated_at = Column(DateTime(timezone=False), server_default=func.now(), onupdate=func.now())
