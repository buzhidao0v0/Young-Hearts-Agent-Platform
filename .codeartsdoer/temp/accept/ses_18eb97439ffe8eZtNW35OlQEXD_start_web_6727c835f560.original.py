#!/usr/bin/env python3
import subprocess
import sys
sys.exit(subprocess.call([sys.executable, "scripts/start.py", "--services", "web"]))
