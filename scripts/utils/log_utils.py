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
    prefix = _color(f"[{service_name}]", "cyan")
    line = message.rstrip()
    if line:
        print(f"{prefix} {line}")
