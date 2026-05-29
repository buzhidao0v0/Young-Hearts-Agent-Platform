from datetime import datetime
from typing import Optional

from py_schemas.base import BaseSchema


class NoticeCreate(BaseSchema):
    title: str
    content: Optional[str] = None
    notice_type: str = "general"


class NoticeResponse(BaseSchema):
    id: int
    title: str
    content: Optional[str] = None
    notice_type: str = "general"
    status: str = "draft"
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
