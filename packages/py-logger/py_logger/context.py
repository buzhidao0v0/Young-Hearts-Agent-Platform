import contextvars

import structlog

trace_id: contextvars.ContextVar[str] = contextvars.ContextVar("trace_id", default="")


def set_trace_id(tid: str) -> None:
    trace_id.set(tid)
    structlog.contextvars.bind_contextvars(trace_id=tid)


def clear_trace_id() -> None:
    trace_id.set("")
    try:
        structlog.contextvars.unbind_contextvars("trace_id")
    except KeyError:
        pass


def get_trace_id() -> str:
    return trace_id.get("")
