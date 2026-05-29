#!/usr/bin/env python3
"""心青年智能体平台统一启动脚本。"""

import argparse
import os
import signal
import sys
import threading
import time

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "utils"))
from check_utils import run_preflight_checks
from log_utils import print_banner, print_colored, print_service_log, print_shutdown_progress, print_stage_header
from process_utils import graceful_terminate, is_process_alive, launch_process

SERVICE_COMMANDS = {
    "api": ["python", "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"],
    "web": ["pnpm", "--dir", "apps/web-client", "run", "dev"],
    "worker": ["celery", "-A", "src.ai_worker.celery_app", "worker", "--loglevel=info"],
}

SERVICE_CWD = {
    "api": "apps/api-server",
    "web": ".",
    "worker": "apps/ai-worker",
}

SERVICE_PORTS = {
    "api": 8000,
    "web": 5173,
}

processes: list[tuple[str, object]] = []
shutdown_requested = False


def _stream_output(name: str, proc: object) -> None:
    try:
        for line in iter(proc.stdout.readline, ""):
            if not line:
                break
            print_service_log(name, line)
    except (ValueError, OSError):
        pass


def signal_handler(signum: int, frame: object) -> None:
    """SIGINT/SIGTERM 信号处理：优雅停止所有服务。"""
    global shutdown_requested
    if shutdown_requested:
        return
    shutdown_requested = True
    print_stage_header("正在停止所有服务")
    for name, proc in reversed(processes):
        if is_process_alive(proc):
            print_shutdown_progress(name, proc.pid, "stopping")
            graceful_terminate(proc)
            if is_process_alive(proc):
                print_shutdown_progress(name, proc.pid, "timeout")
            else:
                print_shutdown_progress(name, proc.pid, "ok")
    print_colored("所有服务已停止", "green")
    sys.exit(0)


def interactive_menu() -> list[str]:
    """交互式菜单，返回用户选择的服务列表。"""
    print_colored("\n  心青年智能体平台 - 启动控制台", "bold")
    print_colored("  ─────────────────────────────", "cyan")
    print("  [1] API Server    (FastAPI :8000)")
    print("  [2] AI Worker     (Celery)")
    print("  [3] Web Client    (Vite :5173)")
    print("  [4] All           (API + Worker + Web)")
    print("  [q] Quit")
    choice = input("\n  请选择 > ").strip().lower()
    mapping = {"1": ["api"], "2": ["worker"], "3": ["web"], "4": ["api", "worker", "web"]}
    return mapping.get(choice, [])


def main() -> None:
    """主入口：解析参数、前置检查、启动服务并监控进程。"""
    parser = argparse.ArgumentParser(description="心青年智能体平台 - 统一启动脚本")
    parser.add_argument("--services", type=str, help="逗号分隔的服务组合: api,worker,web")
    parser.add_argument("--env-file", type=str, default=".env", help="环境文件路径（默认 .env）")
    args = parser.parse_args()

    services: list[str] = []
    if args.services:
        services = [s.strip() for s in args.services.split(",")]
    elif sys.stdin.isatty():
        services = interactive_menu()
    else:
        print_colored("CI 环境：请使用 --services 参数指定服务", "red")
        sys.exit(1)

    if not services:
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print_banner()

    print_stage_header("阶段一：前置环境检查")
    if not run_preflight_checks(services, env_file=args.env_file):
        print_colored("前置检查失败，启动中止", "red")
        sys.exit(1)
    print_colored("所有前置检查通过", "green")

    print_stage_header("阶段二：启动服务")
    original_cwd = os.getcwd()
    for name in services:
        if name not in SERVICE_COMMANDS:
            print_colored(f"  未知服务: {name}", "yellow")
            continue
        cwd = SERVICE_CWD.get(name, ".")
        os.chdir(os.path.join(original_cwd, cwd))
        proc = launch_process(SERVICE_COMMANDS[name])
        os.chdir(original_cwd)
        processes.append((name, proc))
        print_colored(f"  ✔ {name.upper()} 已启动 (PID: {proc.pid})", "green")
        t = threading.Thread(target=_stream_output, args=(name, proc), daemon=True)
        t.start()

    print_stage_header("阶段三：运行中")
    for name in services:
        port = SERVICE_PORTS.get(name)
        if port:
            if name == "api":
                print_colored(f"  后端文档: http://localhost:{port}/docs", "cyan")
            elif name == "web":
                print_colored(f"  前端地址: http://localhost:{port}", "cyan")
    print_colored("\n  按 Ctrl+C 停止所有服务", "yellow")

    try:
        while not shutdown_requested:
            for name, proc in processes:
                if not is_process_alive(proc):
                    print_colored(f"  ⚠ {name} 进程已退出 (code: {proc.returncode})", "red")
            time.sleep(2)
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)


if __name__ == "__main__":
    main()
