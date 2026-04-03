#!/usr/bin/env python3
"""
PyWR Canvas — build script
Produces a standalone installer that requires nothing installed to run.

Usage:
    python build.py

Output:
    Windows → release/PyWR Canvas Setup <version>.exe
    Mac     → release/PyWR Canvas-<version>.dmg
"""

import subprocess
import sys
import os
import shutil
import platform

ROOT = os.path.dirname(os.path.abspath(__file__))


def run(cmd, description):
    print(f"\n>>> {description}")
    result = subprocess.run(cmd, shell=True, cwd=ROOT)
    if result.returncode != 0:
        print(f"\nFailed at: {description}")
        sys.exit(result.returncode)


def check_node():
    if shutil.which("node") is None:
        print("Error: Node.js is not installed.")
        print("Download from: https://nodejs.org/en/download")
        print("Install it once, then run this script again.")
        sys.exit(1)
    result = subprocess.run("node --version", shell=True, capture_output=True, text=True)
    print(f"Node.js {result.stdout.strip()} found.")


def main():
    print("=" * 50)
    print(f"  PyWR Canvas — Build ({platform.system()})")
    print("=" * 50)

    check_node()

    run("npm install",        "Installing dependencies")
    run("npm run build:react",    "Building React app")
    run("npm run build:electron", "Packaging installer")

    release_dir = os.path.join(ROOT, "release")
    print("\n" + "=" * 50)
    print("  Build complete!")
    print(f"  Output folder: {release_dir}")
    print("=" * 50)

    if os.path.isdir(release_dir):
        for f in os.listdir(release_dir):
            if f.endswith((".exe", ".dmg")):
                size_mb = os.path.getsize(os.path.join(release_dir, f)) / 1_000_000
                print(f"  {f}  ({size_mb:.0f} MB)")

    print("\nShare the installer file.")
    print("Users just double-click it — no Node.js, no Python, no terminal.\n")


if __name__ == "__main__":
    main()
