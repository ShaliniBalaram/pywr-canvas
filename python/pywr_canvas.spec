# python/pywr_canvas.spec — PyInstaller spec file for PyWR Canvas backend
# Freezes python/server.py into python/dist/pywr_backend.exe
# Run: pyinstaller python/pywr_canvas.spec

import os
import sys

block_cipher = None

# Resolve paths relative to repo root (one level above this spec file)
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(SPEC), '..'))
PYTHON_DIR = os.path.join(REPO_ROOT, 'python')

a = Analysis(
    [os.path.join(PYTHON_DIR, 'server.py')],
    pathex=[PYTHON_DIR, REPO_ROOT],
    binaries=[],
    datas=[
        (os.path.join(PYTHON_DIR, 'pywr_schema.py'), '.'),
        (os.path.join(PYTHON_DIR, 'add_recorders.py'), '.'),
    ],
    hiddenimports=[
        'flask',
        'flask_cors',
        'werkzeug',
        'werkzeug.serving',
        'werkzeug.routing',
        'werkzeug.exceptions',
        'werkzeug.middleware.proxy_fix',
        'jinja2',
        'click',
        'itsdangerous',
        'pywr',
        'pywr.core',
        'pywr.nodes',
        'pywr.parameters',
        'pywr.recorders',
        'pywr.recorders.recorders',
        'pywr.domains',
        'pywr.domains.river',
        'pywr.dataframe_tools',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='pywr_backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,   # --noconsole: no terminal window when exe runs
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # onefile: all bundled into a single exe
    onefile=True,
)
