"""py_auth — 认证与授权共享包。"""
from py_auth.jwt_handler import create_access_token, decode_access_token, get_password_hash, verify_password
from py_auth.middleware import TenantIsolationMiddleware, require_auth
from py_auth.password import hash_password
from py_auth.password import verify_password as check_password
from py_auth.rbac import has_role, require_role

__all__ = [
    "verify_password",
    "get_password_hash",
    "create_access_token",
    "decode_access_token",
    "hash_password",
    "check_password",
    "has_role",
    "require_role",
    "require_auth",
    "TenantIsolationMiddleware",
]
