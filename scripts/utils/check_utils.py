import os
import shutil
import socket

from scripts.utils.log_utils import print_check_result


def check_env_file(env_file: str = ".env") -> tuple[bool, str]:
    if os.path.isfile(env_file):
        print_check_result(f".env 文件存在 ({env_file})", True)
        return True, ""
    print_check_result(f".env 文件不存在 ({env_file})", False, f"请复制 .env.example 为 {env_file} 并填写配置")
    return False, f"缺少 {env_file}"


def check_python_env() -> tuple[bool, str]:
    if shutil.which("python") or shutil.which("python3"):
        print_check_result("Python 环境", True)
        return True, ""
    print_check_result("Python 环境", False, "未找到 python/python3")
    return False, "未找到 Python"


def check_node_env() -> tuple[bool, str]:
    if shutil.which("node") and shutil.which("pnpm"):
        print_check_result("Node + pnpm 环境", True)
        return True, ""
    detail = ""
    if not shutil.which("node"):
        detail = "未找到 node"
    elif not shutil.which("pnpm"):
        detail = "未找到 pnpm"
    print_check_result("Node + pnpm 环境", False, detail)
    return False, detail


def check_port(port: int, host: str = "localhost") -> tuple[bool, str]:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.connect((host, port))
            print_check_result(f"端口 {port}", False, "已被占用")
            return False, f"端口 {port} 已被占用"
        except ConnectionRefusedError:
            print_check_result(f"端口 {port}", True, "可用")
            return True, ""


def check_redis(host: str = "localhost", port: int = 6379) -> tuple[bool, str]:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.settimeout(3)
            s.connect((host, port))
            print_check_result("Redis 连通性", True)
            return True, ""
        except (ConnectionRefusedError, OSError):
            print_check_result("Redis 连通性", False, f"{host}:{port} 不可达（强依赖，启动中止）")
            return False, f"Redis {host}:{port} 不可达"


def check_mysql(host: str = "localhost", port: int = 3306) -> tuple[bool, str]:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.settimeout(3)
            s.connect((host, port))
            print_check_result("MySQL 连通性", True)
            return True, ""
        except (ConnectionRefusedError, OSError):
            print_check_result("MySQL 连通性", False, f"{host}:{port} 不可达（弱依赖，仅警告）")
            return True, ""


def run_preflight_checks(services: list[str], env_file: str = ".env") -> bool:
    all_passed = True

    ok, _ = check_env_file(env_file)
    if not ok:
        all_passed = False

    ok, _ = check_python_env()
    if not ok:
        all_passed = False

    if "web" in services:
        ok, _ = check_node_env()
        if not ok:
            all_passed = False

    ok, _ = check_redis()
    if not ok:
        all_passed = False

    check_mysql()

    for port in [8000, 5173]:
        check_port(port)

    return all_passed
