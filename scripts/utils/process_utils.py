"""子进程启动与终止管理工具模块。"""

import os
import signal
import subprocess
import sys


def launch_process(command: list[str], env: dict | None = None, service_name: str = "") -> subprocess.Popen:
    """启动子进程，返回 Popen 实例。"""
    proc_env = {**os.environ, **(env or {})}
    kwargs: dict = {"stdout": subprocess.PIPE, "stderr": subprocess.STDOUT, "env": proc_env}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        kwargs["start_new_session"] = True
    return subprocess.Popen(command, **kwargs)


def graceful_terminate(proc: subprocess.Popen, timeout: int = 10) -> None:
    """优雅终止子进程，超时后强制 kill。"""
    if sys.platform == "win32":
        try:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True, timeout=timeout)
        except (subprocess.TimeoutExpired, FileNotFoundError):
            proc.kill()
    else:
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            proc.terminate()
        try:
            proc.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            proc.kill()


def force_terminate(proc: subprocess.Popen) -> None:
    """强制终止子进程。"""
    proc.kill()


def is_process_alive(proc: subprocess.Popen) -> bool:
    """检查子进程是否仍在运行。"""
    return proc.poll() is None
