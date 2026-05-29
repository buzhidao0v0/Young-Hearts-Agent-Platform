"""认证中间件与依赖注入模块。"""

from collections.abc import Callable
from fastapi import HTTPException, Request, status


async def require_auth(request: Request) -> Request:
    """从 Cookie 或 Header 提取 session_id，缺失则抛出 401。"""
    session_id = request.cookies.get("session_id") or request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未认证：缺少 session_id")
    return request


class TenantIsolationMiddleware:
    """租户隔离中间件，透传 ASGI 请求。"""

    def __init__(self, app: object) -> None:
        """初始化实例，设置核心属性。"""
        self.app = app

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        """ASGI 调用入口，透传请求至下游应用。"""
        await self.app(scope, receive, send)
