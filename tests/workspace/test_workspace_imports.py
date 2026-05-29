import pytest


PY_PACKAGES = [
    ("py_config", "settings"),
    ("py_db", "Base"),
    ("py_db", "get_db"),
    ("py_db", "init_db"),
    ("py_schemas", "BaseSchema"),
    ("py_auth", "verify_password"),
    ("py_auth", "create_access_token"),
    ("py_ai_engine", "LLMClient"),
    ("py_logger", "get_logger"),
    ("py_logger", "configure_logging"),
    ("py_messaging", "WxPusherClient"),
    ("py_messaging", "NapCatClient"),
]


@pytest.mark.parametrize("module_name,attr", PY_PACKAGES)
def test_workspace_import(module_name, attr):
    mod = __import__(module_name)
    assert hasattr(mod, attr), f"{module_name}.{attr} not found"


def test_py_config_settings_instance():
    from py_config import settings
    assert settings.APP_NAME is not None
    assert settings.SECRET_KEY is not None


def test_py_db_base_has_metadata():
    from py_db import Base
    assert hasattr(Base, "metadata")


def test_py_schemas_base_schema():
    from py_schemas.base import BaseSchema
    assert BaseSchema.model_config.get("from_attributes") is True


def test_py_logger_events():
    from py_logger.events import AUTH_LOGIN_SUCCEEDED, TASK_DISPATCHED
    assert AUTH_LOGIN_SUCCEEDED == "auth_login_succeeded"
    assert TASK_DISPATCHED == "task_dispatched"
