#!/usr/bin/env python3
"""
Build script — creates a standalone PyWR Canvas desktop app for the current platform.

Usage:
    python build.py

Requirements:
    pip install pyinstaller
    npm install  (run once to install Node dependencies)
"""

import subprocess
import sys
import platform
import os

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))


def run(cmd, **kwargs):
    print(f"\n> {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    subprocess.check_call(cmd, **kwargs)


def main():
    os.chdir(REPO_ROOT)
    os_name = platform.system()
    print(f"Building PyWR Canvas for {os_name}...\n")

    # 1. Ensure PyInstaller is available
    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        print("Installing PyInstaller...")
        run([sys.executable, "-m", "pip", "install", "pyinstaller"])

    # 2. Bundle Python backend
    print("\n--- Step 1/3: Bundling Python backend ---")
    run([
        sys.executable, "-m", "PyInstaller",
        "python/pywr_canvas.spec",
        "--distpath", "python/dist",
        "--workpath", "python/build",
        "--noconfirm",
    ])

    # 3. Build React frontend
    print("\n--- Step 2/3: Building React frontend ---")
    run(["npm", "run", "build:react"])

    # 4. Package with Electron
    print("\n--- Step 3/3: Packaging Electron app ---")
    run(["npm", "run", "build:electron"])

    # Report output
    release_dir = os.path.join(REPO_ROOT, "release")
    print(f"\n{'='*50}")
    print("  BUILD SUCCESSFUL")
    print(f"  Output: {release_dir}")
    if os_name == "Darwin":
        print("  Look for a .dmg file — open it to install the app.")
    elif os_name == "Windows":
        print("  Look for a Setup .exe file to install the app.")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
