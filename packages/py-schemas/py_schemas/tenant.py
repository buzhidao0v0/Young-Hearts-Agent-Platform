from typing import Optional

from py_schemas.base import BaseSchema


class TenantCreate(BaseSchema):
    name: str
    slug: str


class TenantResponse(BaseSchema):
    id: int
    name: str
    slug: str
    status: str = "active"
