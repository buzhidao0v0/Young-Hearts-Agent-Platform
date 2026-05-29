from fastapi import Depends, HTTPException, Request, status


async def require_auth(request: Request) -> Request:
    session_id = request.cookies.get("session_id") or request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未认证：缺少 session_id")
    return request


class TenantIsolationMiddleware:
    def __init__(self, app: object) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        await self.app(scope, receive, send)
