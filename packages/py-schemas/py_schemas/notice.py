"""通知相关 Schema 定义模块。"""

from datetime import datetime
from typing import Optional

from py_schemas.base import BaseSchema


class NoticeCreate(BaseSchema):
    """通知创建请求模型。"""

    title: str
    content: Optional[str] = None
    notice_type: str = "general"


class NoticeResponse(BaseSchema):
    """通知响应模型。"""

    id: int
    title: str
    content: Optional[str] = None
    notice_type: str = "general"
    status: str = "draft"
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
