import logging
import structlog


def configure_logging(level: str = "INFO", json_format: bool = False) -> None:
    logging.basicConfig(format="%(message)s", level=getattr(logging, level, logging.INFO))
    renderer = structlog.processors.JSONRenderer() if json_format else structlog.dev.ConsoleRenderer()
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.NOTSET),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = "app") -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
