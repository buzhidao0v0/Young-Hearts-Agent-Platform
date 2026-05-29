#!/usr/bin/env python3
"""Web Client 快捷启动脚本。"""

import subprocess
import sys
sys.exit(subprocess.call([sys.executable, "scripts/start.py", "--services", "web"]))
