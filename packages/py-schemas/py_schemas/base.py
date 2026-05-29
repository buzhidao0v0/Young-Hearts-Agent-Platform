"""基础 Schema 定义模块。"""

from pydantic import BaseModel


class BaseSchema(BaseModel):
    """基础 Schema，启用 from_attributes 模式以兼容 ORM 对象。"""

    model_config = {"from_attributes": True}
