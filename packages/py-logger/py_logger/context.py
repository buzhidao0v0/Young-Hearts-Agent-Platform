import contextvars

trace_id: contextvars.ContextVar[str] = contextvars.ContextVar("trace_id", default="")


def set_trace_id(tid: str) -> None:
    trace_id.set(tid)


def get_trace_id() -> str:
    return trace_id.get("")
