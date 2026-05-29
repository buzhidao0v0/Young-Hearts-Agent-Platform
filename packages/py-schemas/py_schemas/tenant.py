"""租户相关 Schema 定义模块。"""


from py_schemas.base import BaseSchema


class TenantCreate(BaseSchema):
    """租户创建请求模型。"""

    name: str
    slug: str


class TenantResponse(BaseSchema):
    """租户响应模型。"""

    id: int
    name: str
    slug: str
    status: str = "active"
