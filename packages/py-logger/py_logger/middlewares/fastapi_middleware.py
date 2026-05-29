"""请求日志中间件模块。"""

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from py_logger.context import set_trace_id, get_trace_id
from py_logger.core import get_logger
from py_logger.events import REQUEST_RECEIVED, REQUEST_COMPLETED

logger = get_logger("middleware.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """请求日志中间件，记录请求/响应信息并注入 Trace-ID。"""

    async def dispatch(self, request: Request, call_next) -> Response:
        """拦截请求，注入 Trace-ID 并记录请求/响应日志。

        Args:
            request: 当前请求对象。
            call_next: 下一个中间件或路由处理函数。

        Returns:
            响应对象。
        """
        trace = request.headers.get("X-Trace-ID", uuid.uuid4().hex[:16])
        set_trace_id(trace)
        start = time.perf_counter()
        logger.info(
            REQUEST_RECEIVED,
            method=request.method,
            path=request.url.path,
            trace_id=trace,
        )
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            REQUEST_COMPLETED,
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            elapsed_ms=round(elapsed_ms, 2),
            trace_id=trace,
        )
        response.headers["X-Trace-ID"] = trace
        return response
