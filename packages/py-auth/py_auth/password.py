"""密码哈希与校验模块。"""

from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(plain: str) -> str:
    """对明文密码进行哈希。"""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """校验明文密码与哈希是否匹配。"""
    return _pwd_context.verify(plain, hashed)
