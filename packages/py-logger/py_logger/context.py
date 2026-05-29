"""Trace-ID 上下文变量管理模块。"""

import contextvars

import structlog

trace_id: contextvars.ContextVar[str] = contextvars.ContextVar("trace_id", default="")


def set_trace_id(tid: str) -> None:
    """设置当前请求的 Trace-ID 并绑定到 structlog 上下文。"""
    trace_id.set(tid)
    structlog.contextvars.bind_contextvars(trace_id=tid)


def clear_trace_id() -> None:
    """清除当前请求的 Trace-ID。"""
    trace_id.set("")
    try:
        structlog.contextvars.unbind_contextvars("trace_id")
    except KeyError:
        pass


def get_trace_id() -> str:
    """获取当前请求的 Trace-ID。"""
    return trace_id.get("")
