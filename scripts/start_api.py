#!/usr/bin/env python3
"""API Server 快捷启动脚本。"""

import subprocess
import sys
sys.exit(subprocess.call([sys.executable, "scripts/start.py", "--services", "api"]))
