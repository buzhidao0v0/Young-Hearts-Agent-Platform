import sys

_COLORS = {
    "red": "\033[91m",
    "green": "\033[92m",
    "yellow": "\033[93m",
    "cyan": "\033[96m",
    "bold": "\033[1m",
    "reset": "\033[0m",
}

_USE_COLOR = hasattr(sys.stdout, "isatty") and sys.stdout.isatty()


def _color(text: str, color: str) -> str:
    if not _USE_COLOR:
        return text
    return f"{_COLORS.get(color, '')}{text}{_COLORS['reset']}"


def print_colored(text: str, color: str = "cyan") -> None:
    print(_color(text, color))


def print_stage_header(title: str) -> None:
    width = 60
    print()
    print(_color("=" * width, "bold"))
    print(_color(f"  {title}", "bold"))
    print(_color("=" * width, "bold"))
    print()


def print_check_result(name: str, passed: bool, detail: str = "") -> None:
    mark = _color("✔", "green") if passed else _color("✘", "red")
    suffix = f"  {detail}" if detail else ""
    print(f"  {mark} {name}{suffix}")


def print_service_log(service_name: str, message: str) -> None:
    max_width = 8
    padded = service_name.upper().ljust(max_width)
    prefix = _color(f"[{padded}]", "cyan")
    line = message.rstrip()
    if line:
        print(f"{prefix} {line}")


def print_banner() -> None:
    title = "心青年智能体平台"
    version = "v1.0.0"
    inner_width = 44
    title_line = f"  {title}  {version}".center(inner_width)
    lines = [
        "╔" + "═" * inner_width + "╗",
        "║" + title_line + "║",
        "╚" + "═" * inner_width + "╝",
    ]
    for line in lines:
        print(_color(line, "cyan"))
    print()


def print_shutdown_progress(name: str, pid: int, status: str) -> None:
    if status == "ok":
        mark = _color("✔", "green")
        label = "已关闭"
    elif status == "timeout":
        mark = _color("⚠", "yellow")
        label = "强制终止"
    else:
        mark = "→"
        label = "正在终止..."
    print(f"  {mark} {name} (PID: {pid}) {label}")
