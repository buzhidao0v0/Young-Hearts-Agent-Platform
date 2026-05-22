#!/usr/bin/env python3
import os
import sys
import uuid
import signal
import subprocess
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 注入全局启动trace_id
STARTUP_TRACE_ID = str(uuid.uuid4())
os.environ["STARTUP_TRACE_ID"] = STARTUP_TRACE_ID

# 导入工具函数，直接从文件导入
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "utils"))
from check_utils import validate_env, check_port

def print_stage_header(title: str) -> None:
    """打印阶段分隔标题"""
    print(f"\n{'='*60}")
    print(f"🚀 {title}")
    print('='*60)

def print_service_status(service: str, status: str, pid: int = None) -> None:
    """打印服务状态"""
    status_map = {
        "started": "✔",
        "starting": "●",
        "stopped": "✘"
    }
    pid_info = f" (PID: {pid})" if pid else ""
    print(f"{status_map.get(status, ' ')} {service.upper()} 服务 {status}{pid_info}")

def launch_service(command: str, service_name: str) -> subprocess.Popen:
    """启动服务进程"""
    env = os.environ.copy()
    env["SERVICE_NAME"] = service_name
    
    proc = subprocess.Popen(
        command,
        shell=True,
        env=env,
        stdout=sys.stdout,
        stderr=sys.stderr,
        text=True
    )
    return proc

def graceful_terminate(proc: subprocess.Popen, timeout: int = 5) -> None:
    """优雅终止进程"""
    try:
        if sys.platform == "win32":
            proc.send_signal(signal.CTRL_C_EVENT)
        else:
            proc.send_signal(signal.SIGTERM)
        proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.kill()

processes = []

def signal_handler(signum, frame):
    """优雅终止信号处理"""
    print_stage_header("正在停止所有服务")
    for proc in reversed(processes):
        graceful_terminate(proc)
    print("所有服务已停止")
    sys.exit(0)

def main(services: list):
    # 注册信号处理
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # 前置检查阶段
    print_stage_header("前置环境检查")
    
    valid, err = validate_env()
    if not valid:
        print(f"✘ 环境校验失败: {err}")
        sys.exit(1)
    
    # 端口检查
    required_ports = {
        "api": 8000,
        "web": 5173
    }
    
    for service in services:
        if service in required_ports:
            port = required_ports[service]
            if not check_port(port):
                print(f"✘ {service} 端口 {port} 已被占用，请先关闭占用进程")
                sys.exit(1)
    
    print("✔ 所有检查项通过")

    # 服务启动阶段
    print_stage_header("启动服务")
    service_commands = {
        "api": "cd apps/api-server && python -m uvicorn app.main:app --reload --port 8000",
        "web": "cd apps/web-client && npm run dev",
        "worker": "cd apps/api-server && celery -A app.core.celery_app worker --loglevel=info"
    }

    for service in services:
        if service not in service_commands:
            print(f"⚠ 未知服务: {service}")
            continue
        
        proc = launch_service(service_commands[service], service_name=service)
        processes.append(proc)
        print_service_status(service, "started", pid=proc.pid)

    print_stage_header("服务已全部启动成功")
    print(f"📝 启动Trace ID: {STARTUP_TRACE_ID}")
    print(f"🌐 前端地址: http://localhost:5173")
    print(f"🔌 后端文档: http://localhost:8000/docs")
    print(f"\n按 Ctrl+C 停止所有服务")

    # 等待进程结束
    for proc in processes:
        proc.wait()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python start.py [all|api|web|worker]")
        sys.exit(1)
    
    target = sys.argv[1].lower()
    services = []
    
    if target == "all":
        services = ["api", "web"]
    else:
        services = [target]
    
    main(services)
