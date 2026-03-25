# DEV_SETUP.md — PyWR Canvas development setup

## Prerequisites

Before starting, you must have these installed:

| Tool         | Required version | Check command           |
|--------------|------------------|-------------------------|
| Node.js      | 18.x or 20.x     | `node --version`        |
| npm          | 9.x or higher    | `npm --version`         |
| Python       | 3.11.x           | `python --version`      |
| pip          | 23.x or higher   | `pip --version`         |
| Git          | any recent       | `git --version`         |

Python must be 3.11 — not 3.12, not 3.10. Pywr has specific version constraints.

---

## One-time setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/pywr-canvas.git
cd pywr-canvas

# 2. Install Node dependencies
npm install

# 3. Create Python virtual environment (strongly recommended)
python -m venv .venv

# 4. Activate it
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# 5. Install Python dependencies
pip install flask flask-cors pywr pyinstaller

# 6. Verify Pywr installed correctly
python -c "import pywr; print(pywr.__version__)"
# Should print a version number, not an error
```

---

## Running in development

You need two terminals open simultaneously.

**Terminal 1 — Python backend:**
```bash
# Make sure your venv is active
.venv\Scripts\activate   # Windows
python python/server.py
# Should print: PyWR Canvas backend started on port 47821
```

**Terminal 2 — Electron + React:**
```bash
npm run dev
# Starts React dev server then launches Electron window
```

The app window should open. If the Python backend is not running,
the app will show an error dialog after 5 seconds.

---

## Building the .exe

All three steps must be run in order. Each depends on the previous.

```bash
# Step 1: Freeze Python backend to .exe
# Make sure your venv is active first
npm run build:python
# Produces: python/dist/pywr_backend.exe

# Step 2: Build React app
npm run build:react
# Produces: dist/ folder

# Step 3: Package with electron-builder
npm run build:electron
# Produces: release/PyWR Canvas Setup <version>.exe

# Or run all three in sequence:
npm run build
```

The final installer is at: `release/PyWR Canvas Setup <version>.exe`

---

## Running tests

```bash
# Python tests
python -m pytest python/tests/ -v

# TypeScript type check (no test runner yet, just type safety)
npx tsc --noEmit
```

---

## Troubleshooting

**"Cannot find module pywr"**
You are not in the virtual environment. Run `.venv\Scripts\activate` first.

**"Port 47821 already in use"**
A previous Python process is still running. Find and kill it:
```bash
# Windows
netstat -ano | findstr :47821
taskkill /PID <pid> /F
```

**"pywr_backend.exe is not recognised"**
Run `npm run build:python` first. The exe must exist before `build:electron`.

**"Module not found" in PyInstaller build**
Add the missing module to `hiddenimports` in `python/pywr_canvas.spec`.
Do not guess module names — find them by running the server and checking imports.

**Electron window is blank / white**
The React dev server (port 3000) may not have started yet.
Wait a few seconds and reload with Ctrl+R.

---

## Environment variables

None required. The app uses no environment variables.
The Flask port (47821) is hardcoded in both `python/server.py` and `electron/main.js`.

---

## File you must provide manually

`assets/icon.ico` — the application icon. This is not generated.
Without it, `npm run build:electron` will fail.
Minimum size: 256×256px, ICO format.
