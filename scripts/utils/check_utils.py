import os
import socket
from typing import Tuple, Optional
from dotenv import load_dotenv
import structlog

def get_startup_logger():
    """直接在当前文件定义日志器，避免导入问题"""
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.JSONRenderer(),
        ]
    )
    return structlog.get_logger("startup")

logger = get_startup_logger()
load_dotenv()

def validate_env() -> Tuple[bool, Optional[str]]:
    """验证环境配置有效性"""
    try:
        # 简单校验关键环境变量
        required_vars = ["SECRET_KEY"]
        for var in required_vars:
            if not os.getenv(var) and os.getenv("ENV") == "production":
                return False, f"生产环境必须配置 {var} 环境变量"
        return True, None
    except Exception as e:
        return False, f"配置校验失败: {str(e)}"

def check_port(port: int, host: str = "127.0.0.1") -> bool:
    """检查端口是否被占用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) != 0
