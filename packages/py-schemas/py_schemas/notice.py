"""通知相关 Schema 定义模块。"""

from datetime import datetime

from py_schemas.base import BaseSchema


class NoticeCreate(BaseSchema):
    """通知创建请求模型。"""

    title: str
    content: str | None = None
    notice_type: str = "general"


class NoticeResponse(BaseSchema):
    """通知响应模型。"""

    id: int
    title: str
    content: str | None = None
    notice_type: str = "general"
    status: str = "draft"
    published_at: datetime | None = None
    created_at: datetime | None = None
