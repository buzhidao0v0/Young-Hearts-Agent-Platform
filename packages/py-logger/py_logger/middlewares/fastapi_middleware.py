import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from py_logger.context import set_trace_id, get_trace_id
from py_logger.core import get_logger

logger = get_logger("middleware.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        trace = request.headers.get("X-Trace-ID", uuid.uuid4().hex[:16])
        set_trace_id(trace)
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            elapsed_ms=round(elapsed_ms, 2),
            trace_id=trace,
        )
        response.headers["X-Trace-ID"] = trace
        return response
